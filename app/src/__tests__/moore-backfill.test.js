// @vitest-environment node
// moore-backfill — pinned: the paste parser (only her numbers become revenue;
// junk lines reported, never silently dropped) and honest CSV export.
import { describe, it, expect } from 'vitest';
import { parseBackfillLines, customersCsv, ordersCsv } from '../lib/moore-backfill.js';

const NOW = '2026-07-07T12:00:00.000Z';

describe('parseBackfillLines', () => {
  it('full line: name, contact, item, date, amount → a paid historical order', () => {
    const { rows, problems } = parseBackfillLines('Dana, @dana_sews, two teal scrub caps, 2026-03, $60', { now: NOW });
    expect(problems).toEqual([]);
    expect(rows[0].customerName).toBe('Dana');
    expect(rows[0].contactValue).toBe('@dana_sews');
    expect(rows[0].description).toBe('two teal scrub caps');
    expect(rows[0].createdAt).toContain('2026-03-01');
    expect(rows[0].quoteCents).toBe(6000);
    expect(rows[0].paidAt).toBe(rows[0].createdAt); // her real number = real paid history
    expect(rows[0].stage).toBe('delivered');        // done work — no 3-week clock
  });
  it('minimal line: name + item only — NO invented dollars, no invented paid date', () => {
    const { rows } = parseBackfillLines('Mia, custom denim set', { now: NOW });
    expect(rows[0].customerName).toBe('Mia');
    expect(rows[0].description).toBe('custom denim set');
    expect(rows[0].quoteCents).toBe(0);
    expect(rows[0].paidAt).toBeNull();
  });
  it('MM/YYYY dates and bare amounts parse; commas inside the item survive', () => {
    const { rows } = parseBackfillLines('Kim, kim@x.com, prom dress, emerald, 5/2026, 250', { now: NOW });
    expect(rows[0].description).toBe('prom dress, emerald');
    expect(rows[0].createdAt).toContain('2026-05-01');
    expect(rows[0].quoteCents).toBe(25000);
  });
  it('junk lines are REPORTED with the line number, never silently dropped', () => {
    const { rows, problems } = parseBackfillLines('JustAName\nDana, caps', { now: NOW });
    expect(rows.length).toBe(1);
    expect(problems.length).toBe(1);
    expect(problems[0].line).toBe(1);
  });
  it('empty input parses to nothing', () => {
    expect(parseBackfillLines('').rows).toEqual([]);
  });
});

describe('CSV export — her data out, honest', () => {
  const orders = [
    { id: 'a', customerName: 'Dana', contactValue: '@dana', description: 'caps', stage: 'delivered', quoteCents: 6000, paidAt: '2026-03-01', createdAt: '2026-03-01', delivery: 'ship', channel: 'instagram' },
    { id: 'b', customerName: 'Dana', description: 'dress', stage: 'quoted', quoteCents: 20000, paidAt: null, createdAt: '2026-06-01', delivery: 'pickup', channel: 'email' },
    { id: 'demo-1', customerName: 'Fake', description: 'x', createdAt: '2026-01-01', seed: true },
  ];
  it('customers roll up per person; unpaid quotes never count as lifetime paid; seeds excluded', () => {
    const out = customersCsv(orders);
    expect(out).toContain('Dana,@dana,2,2026-03-01,2026-06-01,60.00');
    expect(out).not.toContain('Fake');
  });
  it('orders export one honest row each, quoted-not-paid shown as no', () => {
    const out = ordersCsv(orders);
    expect(out).toContain('2026-06-01,Dana,,dress,quoted,200.00,no');
    expect(out.split('\n')[0]).toContain('Quote ($)');
  });
  it('cells with commas/quotes are escaped', () => {
    const out = ordersCsv([{ id: 'c', customerName: 'A "B", C', description: 'x', createdAt: '2026-01-01', stage: 'delivered', quoteCents: 0, delivery: 'ship', channel: 'other' }]);
    expect(out).toContain('"A ""B"", C"');
  });
});
