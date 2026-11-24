// The spend ledger is corrected by an auditable row, never rewritten (owner,
// 2026-11-24: "Correct the spending ledger through an auditable adjustment
// without deleting its history"). Plus the BFL balance read and the exact
// "remaining" count the library batches are planned from.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Ledger } from '../../scripts/learn-presentation/lib/ledger.mjs';
import { applyAdjustments, validateAdjustments, loadAdjustments } from '../../scripts/learn-presentation/lib/adjust.mjs';
import { imageSpentCents, nextLibraryBatch } from '../../scripts/learn-presentation/lib/scope.mjs';
import { bflCredits } from '../../scripts/learn-presentation/providers/image.mjs';

const ledger = () => new Ledger(join(mkdtempSync(join(tmpdir(), 'adj-')), 'state'));
const row = (l, lessonId, kind, state, cents) =>
  l.write({ batchId: 'b', courseKey: 'c', lessonId, kind, contentSha: 's', idempotencyKey: `b|c|${lessonId}|${kind}`, state, costCents: cents });
const ADJ = {
  id: 'batch1-refused-submits-2026-11-24',
  date: '2026-11-24',
  cents: -990,
  appliesTo: 'image',
  reason: 'refused unbilled',
  evidence: 'run 45443285162 log',
};

describe('ledger adjustments', () => {
  it('apply once as their own row; the original rows stay; the sum is corrected', () => {
    const l = ledger();
    row(l, 'a', 'image', 'failed', 1770);
    expect(applyAdjustments(l, [ADJ])).toEqual([ADJ.id]);
    expect(applyAdjustments(l, [ADJ])).toEqual([]); // idempotent
    expect(l.spentCents()).toBe(780);
    expect(imageSpentCents(l)).toBe(780);
    const lines = readFileSync(l.jobsPath, 'utf8')
      .trim()
      .split('\n')
      .map((x) => JSON.parse(x));
    expect(lines.some((x) => x.costCents === 1770)).toBe(true); // history intact
    expect(lines.filter((x) => x.kind === 'adjustment')).toHaveLength(1);
    expect(lines.find((x) => x.kind === 'adjustment')).toMatchObject({ costCents: -990, reason: 'refused unbilled', evidence: 'run 45443285162 log' });
  });

  it('a text adjustment does not move the picture cap', () => {
    const l = ledger();
    row(l, 'a', 'image', 'succeeded', 6);
    applyAdjustments(l, [{ ...ADJ, id: 'text-fix', appliesTo: 'text', cents: -2 }]);
    expect(imageSpentCents(l)).toBe(6);
    expect(l.spentCents()).toBe(4);
  });

  it('refuses an adjustment with no evidence, no reason, a bad id or an outsized amount (proven to catch)', () => {
    expect(validateAdjustments([{ ...ADJ, evidence: '' }]).join(' ')).toMatch(/evidence/);
    expect(validateAdjustments([{ ...ADJ, reason: ' ' }]).join(' ')).toMatch(/reason/);
    expect(validateAdjustments([{ ...ADJ, id: 'Bad Id' }]).join(' ')).toMatch(/slug/);
    expect(validateAdjustments([{ ...ADJ, cents: -99999 }]).join(' ')).toMatch(/within/);
    expect(validateAdjustments([ADJ, ADJ]).join(' ')).toMatch(/duplicate/);
    expect(() => applyAdjustments(ledger(), [{ ...ADJ, evidence: '' }])).toThrow(/refused/);
  });

  it('the committed adjustments file is valid and carries the batch-1 correction', () => {
    const list = loadAdjustments(resolve(__dirname, '../../scripts/learn-presentation/ledger-adjustments.json'));
    expect(validateAdjustments(list)).toEqual([]);
    expect(list.find((a) => a.id === 'batch1-refused-submits-2026-11-24').cents).toBe(-990);
  });
});

describe('remaining count and BFL balance', () => {
  it('a picture flagged for review is present, not remaining; a failed one is remaining', () => {
    const l = ledger();
    const items = ['x', 'y', 'z'].map((lessonId) => ({ courseKey: 'c', lessonId, contentSha: 's' }));
    for (const id of ['x', 'y', 'z']) row(l, id, 'text', 'succeeded', 1);
    row(l, 'x', 'image', 'succeeded', 6);
    row(l, 'y', 'image', 'needs-review', 6);
    row(l, 'z', 'image', 'failed', 0);
    expect(nextLibraryBatch(items, l, Infinity).map((i) => i.lessonId)).toEqual(['z']);
  });

  it('reads the balance from GET /v1/credits with the x-key header, and refuses a non-numeric answer', async () => {
    const seen = [];
    const fetchImpl = async (url, opts) => {
      seen.push({ url, key: opts.headers['x-key'] });
      return { ok: true, json: async () => ({ credits: 1234.5 }) };
    };
    expect(await bflCredits({ apiKey: 'k', fetchImpl })).toBe(1234.5);
    expect(seen[0]).toEqual({ url: 'https://api.bfl.ai/v1/credits', key: 'k' });
    await expect(bflCredits({ apiKey: 'k', fetchImpl: async () => ({ ok: true, json: async () => ({}) }) })).rejects.toThrow(/numeric/);
  });
});
