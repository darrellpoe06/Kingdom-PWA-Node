// @vitest-environment node
//
// tax-documents — the annual tax-return archive model (Darrell 2026-07-21:
// "where should Christina import years of tax PDFs... use those artifacts to
// help build their behavioral strategies for business systems"). Proven-to-catch
// (DR-0076): the never-lose validation must REJECT an ambiguous/incomplete file,
// grouping must order newest-year-first, and the storage-agnostic fileTaxDoc
// must route bytes through an injected backend without ever fabricating success.
import { describe, it, expect, vi } from 'vitest';
import {
  TAX_DOC_KINDS, validateTaxDoc, canFile, taxDocId, groupByYear, fileTaxDoc,
} from '../lib/tax-documents.js';

const good = (over = {}) => ({ year: 2024, entityId: 'e1', kind: 'return', filename: '2024-1040.pdf', ...over });

describe('validateTaxDoc — nothing files under an ambiguous slot', () => {
  it('accepts a complete record', () => {
    expect(validateTaxDoc(good()).ok).toBe(true);
    expect(canFile(good())).toBe(true);
  });
  it('REJECTS a missing/blank year, entity, or kind', () => {
    expect(validateTaxDoc(good({ year: null })).ok).toBe(false);
    expect(validateTaxDoc(good({ entityId: '' })).ok).toBe(false);
    expect(validateTaxDoc(good({ kind: 'nonsense' })).ok).toBe(false);
  });
  it('REJECTS a year outside a real range', () => {
    expect(validateTaxDoc(good({ year: 1800 })).ok).toBe(false);
    expect(validateTaxDoc(good({ year: 3000 })).ok).toBe(false);
  });
  it('REJECTS a non-PDF or missing filename', () => {
    expect(validateTaxDoc(good({ filename: '' })).ok).toBe(false);
    expect(validateTaxDoc(good({ filename: '2024-return.jpg' })).ok).toBe(false);
    expect(validateTaxDoc(good({ filename: '2024-1040.PDF' })).ok).toBe(true); // case-insensitive
  });
  it('every kind in the vocabulary validates', () => {
    for (const k of TAX_DOC_KINDS) expect(validateTaxDoc(good({ kind: k })).ok).toBe(true);
  });
});

describe('taxDocId — stable + deterministic', () => {
  it('is the same for the same year+entity+kind+filename', () => {
    expect(taxDocId(good())).toBe(taxDocId(good()));
    expect(taxDocId(good())).toMatch(/^tax-/);
  });
  it('differs by year', () => {
    expect(taxDocId(good({ year: 2023 }))).not.toBe(taxDocId(good({ year: 2024 })));
  });
});

describe('groupByYear — newest year first, return before supporting docs', () => {
  it('orders years descending and kinds by rank', () => {
    const docs = [
      good({ year: 2022, kind: 'w2', filename: 'a.pdf' }),
      good({ year: 2024, kind: 'receipt', filename: 'b.pdf' }),
      good({ year: 2024, kind: 'return', filename: 'c.pdf' }),
      good({ year: 2023, kind: 'return', filename: 'd.pdf' }),
    ];
    const g = groupByYear(docs);
    expect(g.map((x) => x.year)).toEqual([2024, 2023, 2022]);
    // within 2024, the filed return sorts before the receipt
    expect(g[0].docs.map((d) => d.kind)).toEqual(['return', 'receipt']);
    expect(g[0].count).toBe(2);
  });
  it('never throws on an empty archive', () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe('fileTaxDoc — storage-agnostic, never fabricates success', () => {
  it('routes bytes through the injected backend and returns a stored record', async () => {
    const put = vi.fn(async (id) => `nas://tax/${id}`);
    const res = await fileTaxDoc(good(), new Uint8Array([1, 2, 3]), { put });
    expect(put).toHaveBeenCalledTimes(1);
    expect(res.ok).toBe(true);
    expect(res.record.status).toBe('stored');
    expect(res.record.storageRef).toMatch(/^nas:\/\/tax\/tax-/);
  });
  it('does NOT store an invalid record', async () => {
    const put = vi.fn();
    const res = await fileTaxDoc(good({ kind: 'bad' }), new Uint8Array(), { put });
    expect(res.skipped).toBe('invalid');
    expect(put).not.toHaveBeenCalled();
  });
  it('reports a backend failure honestly (status error, no fabricated success)', async () => {
    const put = vi.fn(async () => { throw new Error('nas offline'); });
    const res = await fileTaxDoc(good(), new Uint8Array(), { put });
    expect(res.ok).toBeUndefined();
    expect(res.skipped).toBe('store-error');
    expect(res.record.status).toBe('error');
    expect(res.record.storageRef).toBe(null);
  });
  it('skips gracefully when no backend is wired yet', async () => {
    const res = await fileTaxDoc(good(), new Uint8Array(), null);
    expect(res.skipped).toBe('no-backend');
  });
});

describe('buildTaxHistory — the behavioral-strategy DATA (real numbers only)', () => {
  it('builds an oldest->newest history with year-over-year deltas', async () => {
    const { buildTaxHistory } = await import('../lib/tax-documents.js');
    const docs = [
      { year: 2023, kind: 'return', filename: 'a.pdf', figures: { grossIncome: 100000, agi: 90000, totalTax: 12000, refund: 800 } },
      { year: 2024, kind: 'return', filename: 'b.pdf', figures: { grossIncome: 110000, agi: 98000, totalTax: 13500, refund: 600 } },
    ];
    const h = buildTaxHistory(docs);
    expect(h.map((r) => r.year)).toEqual([2023, 2024]);
    expect(h[0].status).toBe('ready');
    expect(h[1].deltas.grossIncome).toBe(10000);   // 110k - 100k
    expect(h[1].deltas.totalTax).toBe(1500);
    expect(h[0].deltas.grossIncome).toBe(null);     // no prior year
  });
  it('marks a year with NO verified figures as pending — never invents numbers', async () => {
    const { buildTaxHistory, hasFigures } = await import('../lib/tax-documents.js');
    const h = buildTaxHistory([{ year: 2022, kind: 'return', filename: 'c.pdf' }]);
    expect(h[0].status).toBe('pending');
    expect(h[0].figs).toBe(null);
    expect(hasFigures(null)).toBe(false);
    expect(hasFigures({ agi: 50000 })).toBe(true);
  });
});
