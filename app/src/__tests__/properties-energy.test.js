// =============================================================================
// THE METER, READ FROM THE UTILITY'S OWN FILE (DR-1098)
// =============================================================================
// What these pin, and why each one is load-bearing:
//   * Green Button XML is read to the same numbers the meter wrote, with the
//     ESPI multipliers applied: value x 10^powerOfTen Wh, cost in 1/100000 $.
//   * NOTHING IS GUESSED. A file without a unit, gas measured by volume, and a
//     demand-only file are REFUSED. The refusal cases are the proven-to-catch
//     half (DR-0076 §3): a parser that defaulted to kWh would pass every
//     happy-path case here and fail exactly these.
//   * The autumn clock change keeps both 1 o'clock hours; a newest-first file
//     is not shifted by that rule; a daily row on the spring change is 23 hours.
//   * A rate per kWh is reported only when EVERY delivered reading carried a
//     cost. A partial cost says "partial", never a rate built on half a bill.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  parseEspiXml, parseUsageCsv, parseEnergyFile, reckonEnergy, readingKey,
  buildReadingRows, buildImportRow, readingFromRow, digestText, wallToUtcMs,
  zoneOffsetMinutes, splitCsvLine, REFUSAL,
} from '../modules/properties/energy.js';

const TZ = 'America/Chicago';
const T0 = Date.UTC(2026, 8, 1, 5, 0, 0) / 1000; // 2026-09-01 00:00 CDT

function readingType({ uom = 72, pow = 0, flow = 1 } = {}) {
  return `<espi:ReadingType><espi:accumulationBehaviour>4</espi:accumulationBehaviour><espi:commodity>1</espi:commodity>`
    + `<espi:currency>840</espi:currency><espi:flowDirection>${flow}</espi:flowDirection><espi:intervalLength>3600</espi:intervalLength>`
    + `<espi:powerOfTenMultiplier>${pow}</espi:powerOfTenMultiplier><espi:uom>${uom}</espi:uom></espi:ReadingType>`;
}
function reading(start, value, { cost, quality, duration = 3600 } = {}) {
  return `<espi:IntervalReading>${cost != null ? `<espi:cost>${cost}</espi:cost>` : ''}`
    + `${quality != null ? `<espi:ReadingQuality><espi:quality>${quality}</espi:quality></espi:ReadingQuality>` : ''}`
    + `<espi:timePeriod><espi:duration>${duration}</espi:duration><espi:start>${start}</espi:start></espi:timePeriod>`
    + `<espi:value>${value}</espi:value></espi:IntervalReading>`;
}
const base = 'https://utility.example/DataCustodian/espi/1_1/resource/Subscription/9';
function feed({ types, blocks }) {
  const entries = [];
  types.forEach((t, i) => {
    entries.push(`<entry><link rel="self" href="${base}/UsagePoint/1/MeterReading/${i + 1}"/>`
      + `<link rel="related" href="${base}/ReadingType/${i + 1}"/><content><espi:MeterReading/></content></entry>`);
    entries.push(`<entry><link rel="self" href="${base}/ReadingType/${i + 1}"/><content>${readingType(t)}</content></entry>`);
  });
  blocks.forEach(({ meter, readings, link = true }) => {
    entries.push(`<entry>${link ? `<link rel="up" href="${base}/UsagePoint/1/MeterReading/${meter}/IntervalBlock"/>` : ''}`
      + `<content><espi:IntervalBlock><espi:interval><espi:duration>86400</espi:duration><espi:start>${T0}</espi:start></espi:interval>`
      + `${readings.join('')}</espi:IntervalBlock></content></entry>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?><!-- a comment --><feed xmlns="http://www.w3.org/2005/Atom" xmlns:espi="http://naesb.org/espi">${entries.join('')}</feed>`;
}

// Eight whole days of hourly reads: 300 Wh overnight (00-05), 1200 Wh otherwise,
// and one 5000 Wh hour on day 3 at 17:00 local.
function eightDays() {
  const rs = [];
  for (let d = 0; d < 8; d += 1) {
    for (let h = 0; h < 24; h += 1) {
      const start = T0 + (d * 24 + h) * 3600;
      const v = d === 3 && h === 17 ? 5000 : (h < 6 ? 300 : 1200);
      rs.push(reading(start, v, { cost: v * 15 })); // ESPI cost is 1/100000 $: 15 per Wh is 15 cents a kWh
    }
  }
  return rs;
}

describe('Green Button XML is read to the numbers the meter wrote', () => {
  it('applies powerOfTen, converts cost, keeps quality and direction', () => {
    const xml = feed({
      types: [{ uom: 72, pow: -3 }, { uom: 72, pow: 0, flow: 19 }],
      blocks: [
        { meter: 1, readings: [reading(T0, 974000, { cost: 14610, quality: 8 }), reading(T0 + 3600, 500000)] },
        { meter: 2, readings: [reading(T0, 250)] },
      ],
    });
    const p = parseEspiXml(xml);
    expect(p.ok).toBe(true);
    expect(p.format).toBe('espi-xml');
    expect(p.readings).toHaveLength(3);
    const [a, b] = p.readings.filter((r) => r.direction === 'delivered');
    expect(a.amount).toBeCloseTo(974, 6);          // 974000 x 10^-3 Wh
    expect(a.costCents).toBeCloseTo(14.61, 6);     // 14610 / 100000 $ = 14.61 cents
    expect(a.quality).toBe('estimated');
    expect(a.startMs).toBe(T0 * 1000);
    expect(b.costCents).toBeNull();
    const rec = p.readings.find((r) => r.direction === 'received');
    expect(rec.amount).toBe(250);
    expect(rec.commodity).toBe('electricity');
  });

  it('reads gas in therms', () => {
    const p = parseEspiXml(feed({ types: [{ uom: 169, pow: -2 }], blocks: [{ meter: 1, readings: [reading(T0, 123, { duration: 86400 })] }] }));
    expect(p.ok).toBe(true);
    expect(p.readings[0]).toMatchObject({ commodity: 'gas', unit: 'therm', seconds: 86400 });
    expect(p.readings[0].amount).toBeCloseTo(1.23, 9);
  });

  it('uses the one ReadingType when blocks carry no links', () => {
    const p = parseEspiXml(feed({ types: [{}], blocks: [{ meter: 1, link: false, readings: [reading(T0, 10)] }] }));
    expect(p.ok).toBe(true);
    expect(p.readings[0].amount).toBe(10);
  });
});

describe('nothing is guessed: the refusals (proven-to-catch)', () => {
  it('refuses gas by volume', () => {
    const p = parseEspiXml(feed({ types: [{ uom: 42 }], blocks: [{ meter: 1, readings: [reading(T0, 5)] }] }));
    expect(p).toEqual({ ok: false, reason: 'volume-gas' });
  });
  it('refuses a demand-only file', () => {
    expect(parseEspiXml(feed({ types: [{ uom: 38 }], blocks: [{ meter: 1, readings: [reading(T0, 5)] }] })).reason).toBe('demand-only');
  });
  it('refuses readings with no ReadingType at all', () => {
    const xml = `<feed><entry><content><IntervalBlock>${reading(T0, 5).replace(/espi:/g, '')}</IntervalBlock></content></entry></feed>`;
    expect(parseEspiXml(xml).reason).toBe('no-unit');
  });
  it('refuses to pick between two measurements when the blocks do not say', () => {
    const p = parseEspiXml(feed({ types: [{}, { flow: 19 }], blocks: [{ meter: 1, link: false, readings: [reading(T0, 5)] }] }));
    expect(p.reason).toBe('unlinked');
  });
  it('refuses a CSV whose header names no unit', () => {
    expect(parseUsageCsv('TYPE,DATE,START TIME,END TIME,USAGE,COST\nElectric usage,2026-09-01,00:00,00:59,0.5,$0.06').reason).toBe('no-unit');
  });
  it('refuses a CSV of gas in CCF', () => {
    expect(parseUsageCsv('TYPE,DATE,USAGE (CCF),COST\nNatural gas usage,2026-09-01,2.1,$3.00').reason).toBe('volume-gas');
  });
  it('refuses something that is not a meter file', () => {
    expect(parseEnergyFile('name,age\nann,4').reason).toBe('not-a-meter-file');
    expect(parseEnergyFile('<html><body>hi</body></html>').reason).toBe('not-a-meter-file');
    expect(parseEnergyFile('   ').reason).toBe('empty');
    expect(REFUSAL['volume-gas']).toMatch(/heat factor/);
  });
});

describe('the utility CSV', () => {
  const opower = [
    'Name,DARRELL POE',
    'Address,"1 Example St, Champaign IL"',
    'Account Number,0000',
    '',
    'TYPE,DATE,START TIME,END TIME,USAGE (kWh),COST,NOTES',
    'Electric usage,2026-09-01,00:00,00:59,0.52,$0.08,',
    'Electric usage,2026-09-01,01:00,01:59,"1,000.5","$1,200.10",',
    'Electric usage,2026-09-01,02:00,02:59,-0.25,-$0.03,',
  ].join('\n');

  it('finds the header, reads inclusive ends as whole hours, and money in cents', () => {
    const p = parseUsageCsv(opower, { timeZone: TZ });
    expect(p.ok).toBe(true);
    expect(p.readings).toHaveLength(3);
    const [a, b, c] = p.readings;
    expect(a.startMs).toBe(Date.UTC(2026, 8, 1, 5, 0));
    expect(a.seconds).toBe(3600);
    expect(a.amount).toBeCloseTo(520, 9);
    expect(a.costCents).toBeCloseTo(8, 9);
    expect(b.amount).toBeCloseTo(1000500, 6);
    expect(b.costCents).toBeCloseTo(120010, 6);
    expect(c.direction).toBe('received');
    expect(c.amount).toBeCloseTo(250, 9);
    expect(c.costCents).toBeCloseTo(-3, 9);
  });

  it('keeps both 1 o’clock hours on the autumn clock change', () => {
    const csv = ['DATE,START TIME,END TIME,USAGE (kWh)',
      '2026-11-01,00:00,00:59,1', '2026-11-01,01:00,01:59,2', '2026-11-01,01:00,01:59,3', '2026-11-01,02:00,02:59,4'].join('\n');
    const p = parseEnergyFile(csv, { timeZone: TZ });
    expect(p.ok).toBe(true);
    expect(p.readings.map((r) => new Date(r.startMs).toISOString())).toEqual([
      '2026-11-01T05:00:00.000Z', '2026-11-01T06:00:00.000Z', '2026-11-01T07:00:00.000Z', '2026-11-01T08:00:00.000Z',
    ]);
  });

  it('does not shift a newest-first file', () => {
    const csv = ['DATE,START TIME,END TIME,USAGE (kWh)', '2026-09-01,02:00,02:59,3', '2026-09-01,01:00,01:59,2', '2026-09-01,00:00,00:59,1'].join('\n');
    const p = parseEnergyFile(csv, { timeZone: TZ });
    expect(p.readings.map((r) => r.amount)).toEqual([1000, 2000, 3000]);
    expect(p.readings[0].startMs).toBe(Date.UTC(2026, 8, 1, 5));
  });

  it('measures a daily row by the house’s midnights, 23 hours on the spring change', () => {
    const p = parseUsageCsv('TYPE,DATE,USAGE (therms),COST\nNatural gas usage,2026-03-08,2.5,$3.10\nNatural gas usage,2026-03-09,2.0,$2.40', { timeZone: TZ });
    expect(p.ok).toBe(true);
    expect(p.readings[0]).toMatchObject({ commodity: 'gas', unit: 'therm', seconds: 23 * 3600 });
    expect(p.readings[1].seconds).toBe(24 * 3600);
  });

  it('takes the interval from the file’s own spacing when there is no end column, and says so', () => {
    const csv = ['Start Date Time,Usage (kWh)', '2026-09-01 00:00,1', '2026-09-01 00:15,1', '2026-09-01 00:30,1'].join('\n');
    const p = parseUsageCsv(csv, { timeZone: TZ });
    expect(p.readings.every((r) => r.seconds === 900)).toBe(true);
    expect(p.notes.join(' ')).toMatch(/start times only/);
  });

  it('reads explicit offsets as written, and 12-hour clocks', () => {
    const p = parseUsageCsv('Interval Start,Interval End,Usage (Wh)\n2026-09-01T00:00:00-05:00,2026-09-01T00:15:00-05:00,250', { timeZone: TZ });
    expect(p.readings[0]).toMatchObject({ startMs: Date.UTC(2026, 8, 1, 5), seconds: 900, amount: 250 });
    const q = parseUsageCsv('Date,Start Time,End Time,Usage (kWh)\n9/1/2026,12:00 AM,12:59 AM,1\n9/1/2026,1:00 PM,1:59 PM,1', { timeZone: TZ });
    expect(new Date(q.readings[1].startMs).toISOString()).toBe('2026-09-01T18:00:00.000Z');
  });

  it('splits quoted cells', () => {
    expect(splitCsvLine('a,"b, c","d ""e"""')).toEqual(['a', 'b, c', 'd "e"']);
  });
});

describe('the time zone arithmetic', () => {
  it('knows Chicago in summer and winter', () => {
    expect(zoneOffsetMinutes(Date.UTC(2026, 6, 1), TZ)).toBe(-300);
    expect(zoneOffsetMinutes(Date.UTC(2026, 0, 1), TZ)).toBe(-360);
    expect(wallToUtcMs({ y: 2026, m: 1, d: 15 }, 8 * 60, TZ)).toBe(Date.UTC(2026, 0, 15, 14));
  });
});

describe('one shape whichever file came in', () => {
  it('drops impossible readings and keeps the first of a conflicting pair, and says so', () => {
    const csv = ['DATE,START TIME,END TIME,USAGE (kWh)', '2026-09-01,00:00,00:59,1', '2026-09-01,00:00,00:59,9', '2026-09-01,01:00,01:59,abc'].join('\n');
    const p = parseEnergyFile(csv, { timeZone: TZ });
    expect(p.readings).toHaveLength(1);
    expect(p.readings[0].amount).toBe(1000);
    expect(p.notes.join(' ')).toMatch(/twice with different values/);
    expect(p.notes.join(' ')).toMatch(/could not be read/);
  });
  it('refuses a file over the size ceiling without reading it', () => {
    expect(parseEnergyFile('x'.repeat(30 * 1024 * 1024 + 1)).reason).toBe('too-large');
  });
});

describe('the reckoning counts, it does not paint', () => {
  const p = parseEnergyFile(feed({ types: [{}], blocks: [{ meter: 1, readings: eightDays() }] }), { timeZone: TZ });
  const [e] = reckonEnergy(p.readings, { timeZone: TZ });

  it('totals, days and the per-day average', () => {
    expect(e.commodity).toBe('electricity');
    // per day: 6 x 0.3 + 18 x 1.2 = 23.4 kWh; day 3 adds 3.8 more
    expect(e.delivered).toBeCloseTo(8 * 23.4 + 3.8, 6);
    expect(e.days).toBe(8);
    expect(e.perDay).toBeCloseTo((8 * 23.4 + 3.8) / 8, 6);
    expect(e.coverage).toMatchObject({ readings: 192, gaps: 0, estimated: 0 });
  });
  it('the always-on draw is the median quiet hour of whole days', () => {
    expect(e.baseloadDays).toBe(8);
    expect(e.baseloadWatts).toBeCloseTo(300, 6);
  });
  it('the peak hour is the real one', () => {
    expect(e.peak.kwh).toBeCloseTo(5, 9);
    expect(new Date(e.peak.startMs).toISOString()).toBe('2026-09-04T22:00:00.000Z'); // 17:00 CDT on day 3
    expect(e.byHour[2]).toBeCloseTo(0.3, 9);
    expect(e.byHour[12]).toBeCloseTo(1.2, 9);
  });
  it('a rate only when every delivered reading carried its cost', () => {
    expect(e.cost.complete).toBe(true);
    expect(e.cost.ratePerKwhCents).toBeCloseTo(15, 9); // 15 x 1000 Wh / 100000 $ = 15 cents a kWh
    const partial = reckonEnergy(p.readings.map((r, i) => (i === 0 ? { ...r, costCents: null } : r)), { timeZone: TZ })[0];
    expect(partial.cost).toMatchObject({ complete: false, ratePerKwhCents: null, reason: 'partial-cost' });
    const none = reckonEnergy(p.readings.map((r) => ({ ...r, costCents: null })), { timeZone: TZ })[0];
    expect(none.cost).toMatchObject({ totalCents: null, reason: 'no-cost-in-file' });
    expect(none.months[0].costCents).toBeNull();
  });
  it('fewer than seven whole days gives no always-on figure, rather than a guess', () => {
    const short = reckonEnergy(p.readings.slice(0, 24 * 5), { timeZone: TZ })[0];
    expect(short.baseloadDays).toBe(5);
    expect(short.baseloadWatts).toBeNull();
  });
  it('counts a gap as a gap', () => {
    const holed = p.readings.filter((_, i) => i !== 50 && i !== 51);
    const r = reckonEnergy(holed, { timeZone: TZ })[0];
    expect(r.coverage.gaps).toBe(1);
    expect(r.coverage.missingHours).toBeCloseTo(2, 9);
  });
  it('reports nothing for a commodity that has no readings', () => {
    expect(reckonEnergy([], { timeZone: TZ })).toEqual([]);
  });
});

describe('the rows for the database', () => {
  const p = parseEnergyFile('DATE,START TIME,END TIME,USAGE (kWh),COST\n2026-09-01,00:00,00:59,0.5,$0.07', { timeZone: TZ });
  it('round-trips a reading through its row', () => {
    const [row] = buildReadingRows(p.readings, { instanceId: 'i', rentalRef: 'r', importId: 'm' });
    expect(row).toEqual({
      instance_id: 'i', rental_ref: 'r', import_id: 'm', commodity: 'electricity', direction: 'delivered',
      start_at: '2026-09-01T05:00:00.000Z', seconds: 3600, amount: 500, unit: 'Wh', cost_cents: 7, quality: 'measured',
    });
    const back = readingFromRow({ ...row, amount: '500', seconds: '3600', cost_cents: '7' });
    expect(readingKey(back)).toBe(readingKey(p.readings[0]));
    expect(back.costCents).toBe(7);
  });
  it('the import row names the file, its span and its notes', () => {
    const row = buildImportRow(p, { instanceId: 'i', rentalRef: 'r', fileName: 'ameren.csv', sha256: 'abc' });
    expect(row).toMatchObject({
      file_name: 'ameren.csv', file_sha256: 'abc', source_format: 'csv', commodities: ['electricity'],
      reading_count: 1, first_start_at: '2026-09-01T05:00:00.000Z', last_end_at: '2026-09-01T06:00:00.000Z',
    });
  });
  it('digests the file text with SHA-256', async () => {
    expect(await digestText('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await digestText('abc', null)).toBeNull();
  });
});
