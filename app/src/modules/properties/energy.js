// =============================================================================
// energy — what a door's meter says, read from the utility's own file
// =============================================================================
// Darrell, 2026-10-18: "I want my home energy system to be incorporated into
// the PoeTech App... evaluate the DRs..."  The record is DR-1098.
//
// REALITY-TRACE (DR-0061), before the code, as the rule requires:
//   * THE REAL DATA is the utility meter. Every other device in the house (the
//     Emporia plugs, the ecobee, the Honeywell thermostats) measures a PART of
//     the house; only the meter measures all of it, and only the meter is what
//     the bill is computed from. So the first road is the meter's own record.
//   * THE REAL FILE is Green Button "Download My Data": an open standard (NAESB
//     REQ.21, the ESPI Atom XML) and, from most utility portals, a CSV of the
//     same intervals. The household downloads it from its own utility account,
//     and nothing in this file talks to a vendor or a cloud. It parses text the
//     family already owns.
//   * NOTHING IS GUESSED. A file that does not say what unit its numbers are
//     in is refused with the reason, never assumed to be kWh. Cubic feet of gas
//     are refused rather than converted, because turning volume into therms
//     needs the utility's heat factor and this file does not have it. A rate
//     per kWh is reported only when EVERY delivered reading carried its own
//     cost; a partial cost is named as partial (DR-0076 §8).
//
// Pure functions only. No I/O, no React, no clock unless one is passed. The
// tab (EnergyTab.jsx) and the cloud layer (cloud.js) do the rest.
// =============================================================================

/** Ceilings that keep one bad file from freezing a phone. */
export const ENERGY_LIMITS = Object.freeze({
  maxBytes: 30 * 1024 * 1024,      // a year of 15-minute reads is ~3 MB of XML
  maxReadings: 250000,             // seven years of 15-minute reads
  maxIntervalSeconds: 31 * 86400,  // a reading longer than a month is a bill, not a read
});

export const COMMODITIES = Object.freeze(['electricity', 'gas']);
export const DIRECTIONS = Object.freeze(['delivered', 'received']);
export const QUALITIES = Object.freeze(['measured', 'estimated', 'edited', 'questionable']);
export const UNIT_OF = Object.freeze({ electricity: 'Wh', gas: 'therm' });

/** Plain words, so no component invents its own vocabulary. */
export const REFUSAL = Object.freeze({
  empty: 'The file is empty.',
  'too-large': 'The file is larger than a meter download should be. Nothing was read.',
  'not-a-meter-file': 'This does not look like a Green Button file from a utility. Nothing was read.',
  'no-unit': 'The file does not say whether its numbers are kWh or therms, so nothing was read. Nothing is guessed.',
  'volume-gas': 'This gas file counts cubic feet, not therms. Converting needs the utility’s heat factor, which the file does not carry, so nothing was read.',
  'demand-only': 'This file holds demand (kW), not energy used (kWh). Nothing was read.',
  'no-readings': 'The file names a meter but holds no readings.',
  'too-many': 'The file holds more readings than one import is allowed. Download a shorter range.',
  'unlinked': 'The readings in this file do not say which measurement they belong to, and the file holds more than one. Nothing was guessed.',
});

// ---------------------------------------------------------------------------
// Small XML helpers. Green Button XML is regular, machine-written Atom; a
// namespace prefix (espi:, ns1:, none) is the only variation that matters, so
// each helper accepts any prefix. No DOMParser, so the same code runs in a
// browser, in a test, and in a worker without a document.
// ---------------------------------------------------------------------------
const P = '(?:[\\w.-]+:)?';
function blocks(xml, name) {
  const re = new RegExp(`<${P}${name}\\b[^>]*?(?:/>|>([\\s\\S]*?)</${P}${name}\\s*>)`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1] ?? '');
  return out;
}
const first = (xml, name) => { const a = blocks(xml, name); return a.length ? a[0] : null; };
function num(xml, name) {
  const v = first(xml, name);
  if (v == null) return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}
function links(xml) {
  const out = [];
  const re = new RegExp(`<${P}link\\b([^>]*?)/?>`, 'g');
  let m;
  while ((m = re.exec(xml)) !== null) {
    const rel = /\brel\s*=\s*"([^"]*)"/.exec(m[1]) || /\brel\s*=\s*'([^']*)'/.exec(m[1]);
    const href = /\bhref\s*=\s*"([^"]*)"/.exec(m[1]) || /\bhref\s*=\s*'([^']*)'/.exec(m[1]);
    if (href) out.push({ rel: rel ? rel[1] : '', href: href[1] });
  }
  return out;
}
const has = (xml, name) => new RegExp(`<${P}${name}\\b`).test(xml);
const meterKey = (href) => {
  const m = /UsagePoint\/([^/?#]+)\/MeterReading\/([^/?#]+)/.exec(href || '');
  return m ? `${m[1]}/${m[2]}` : null;
};
const readingTypeKey = (href) => {
  const m = /ReadingType\/([^/?#]+)/.exec(href || '');
  return m ? m[1] : null;
};

// ESPI code tables (NAESB REQ.21). Only the codes that change what we store.
const UOM = { 72: 'Wh', 169: 'therm', 38: 'W', 42: 'm3', 119: 'ft3', 73: 'VArh', 63: 'VAr' };
const QUALITY = {
  7: 'edited', 8: 'estimated', 9: 'estimated', 12: 'estimated',
  10: 'questionable', 13: 'questionable', 16: 'questionable',
};
const qualityOf = (code) => (code == null ? 'measured' : (QUALITY[code] || 'measured'));

/** Read one ReadingType block into what we need, or a refusal code. */
function readingTypeOf(xml) {
  const uomCode = num(xml, 'uom');
  const uom = UOM[uomCode];
  const pow = num(xml, 'powerOfTenMultiplier') || 0;
  const flow = num(xml, 'flowDirection');
  if (uom === 'Wh') return { ok: true, commodity: 'electricity', unit: 'Wh', scale: 10 ** pow, flow };
  if (uom === 'therm') return { ok: true, commodity: 'gas', unit: 'therm', scale: 10 ** pow, flow };
  if (uom === 'm3' || uom === 'ft3') return { ok: false, reason: 'volume-gas' };
  if (uom === 'W') return { ok: false, reason: 'demand-only' };
  return { ok: false, reason: 'no-unit' };
}

/**
 * Parse Green Button ESPI XML. Returns
 *   { ok: true, format: 'espi-xml', readings, notes }  or  { ok: false, reason }.
 */
export function parseEspiXml(text) {
  const xml = String(text || '').replace(/<!--[\s\S]*?-->/g, '');
  if (!has(xml, 'IntervalBlock') && !has(xml, 'IntervalReading')) return { ok: false, reason: 'not-a-meter-file' };

  let entries = blocks(xml, 'entry');
  if (!entries.length) entries = [xml]; // a bare export with no Atom wrapper

  const readingTypes = new Map(); // ReadingType id -> parsed type
  const meterToType = new Map(); // "usagePoint/meterReading" -> ReadingType id
  const intervalBlocks = [];       // { key, xml }
  const refusals = [];

  for (const e of entries) {
    const ls = links(e);
    const self = (ls.find((l) => l.rel === 'self') || {}).href || '';
    if (has(e, 'ReadingType')) {
      const id = readingTypeKey(self) || `rt${readingTypes.size + 1}`;
      const t = readingTypeOf(first(e, 'ReadingType') || e);
      readingTypes.set(id, t);
      if (!t.ok) refusals.push(t.reason);
    } else if (has(e, 'MeterReading')) {
      const related = ls.filter((l) => l.rel === 'related').map((l) => readingTypeKey(l.href)).find(Boolean);
      const key = meterKey(self);
      if (key && related) meterToType.set(key, related);
    }
    if (has(e, 'IntervalBlock')) {
      const up = (ls.find((l) => l.rel === 'up') || {}).href || '';
      for (const b of blocks(e, 'IntervalBlock')) intervalBlocks.push({ key: meterKey(self) || meterKey(up), xml: b });
    }
  }
  if (!intervalBlocks.length && has(xml, 'IntervalReading')) intervalBlocks.push({ key: null, xml });

  const usable = [...readingTypes.entries()].filter(([, t]) => t.ok);
  if (!usable.length) return { ok: false, reason: refusals[0] || 'no-unit' };

  const readings = [];
  const notes = [];
  let unlinked = 0;
  let skippedType = 0;
  for (const blk of intervalBlocks) {
    let type = null;
    const rtId = blk.key ? meterToType.get(blk.key) : null;
    if (rtId && readingTypes.has(rtId)) type = readingTypes.get(rtId);
    else if (readingTypes.size === 1) type = usable[0][1];
    if (!type) { unlinked += 1; continue; }
    if (!type.ok) { skippedType += 1; continue; }
    for (const r of blocks(blk.xml, 'IntervalReading')) {
      const period = first(r, 'timePeriod') || '';
      const start = num(period, 'start');
      const seconds = num(period, 'duration');
      const raw = num(r, 'value');
      if (start == null || seconds == null || raw == null) continue;
      const cost = num(r, 'cost'); // ESPI cost is in 1/100000 of the currency
      const q = first(r, 'ReadingQuality');
      let amount = raw * type.scale;
      let direction = type.flow === 19 ? 'received' : 'delivered';
      if (type.flow === 4 && amount < 0) { direction = 'received'; amount = -amount; }
      readings.push({
        startMs: start * 1000,
        seconds,
        amount,
        unit: type.unit,
        commodity: type.commodity,
        direction,
        costCents: cost == null ? null : cost / 1000,
        quality: qualityOf(q == null ? null : num(q, 'quality')),
      });
    }
  }
  if (!readings.length) return { ok: false, reason: unlinked ? 'unlinked' : (refusals[0] || 'no-readings') };
  if (unlinked) notes.push(`${unlinked} block(s) of readings did not say which measurement they belong to and were left out.`);
  if (skippedType) notes.push(`${skippedType} block(s) held a measurement this app does not store (demand, or gas by volume) and were left out.`);
  return { ok: true, format: 'espi-xml', readings, notes };
}

// ---------------------------------------------------------------------------
// CSV. The portals that offer Green Button also offer a spreadsheet of the same
// intervals. Their headers vary, so the header row is FOUND, not assumed, and
// the unit must be named in it (or in a units column) or the file is refused.
// ---------------------------------------------------------------------------
export function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const H = {
  date: /^(date|read date|usage date|day|start date|interval date)$/,
  start: /^(start|start time|start date ?time|start datetime|interval start|interval start time|from)$/,
  end: /^(end|end time|end date ?time|end datetime|interval end|interval end time|to)$/,
  usage: /^(usage|consumption|value|quantity|energy|kwh|net usage|import|energy used)\b/,
  cost: /^(cost|amount|charge|charges)\b/,
  units: /^(units?|uom|unit of measure)$/,
};

function unitWord(s) {
  const t = String(s || '').toLowerCase();
  if (/\bkwh\b/.test(t)) return { unit: 'Wh', factor: 1000, commodity: 'electricity' };
  if (/\bwh\b/.test(t)) return { unit: 'Wh', factor: 1, commodity: 'electricity' };
  if (/\btherms?\b/.test(t)) return { unit: 'therm', factor: 1, commodity: 'gas' };
  if (/\b(ccf|mcf|cf|ft3|cubic|m3)\b/.test(t)) return { refuse: 'volume-gas' };
  if (/\bkw\b/.test(t)) return { refuse: 'demand-only' };
  return null;
}

function money(s) {
  const t = String(s || '').trim();
  if (!t) return null;
  const neg = /^\(.*\)$/.test(t) || /^-/.test(t) || /^\$-/.test(t);
  const n = Number(t.replace(/[()$,\s-]/g, ''));
  if (!Number.isFinite(n)) return null;
  return Math.round((neg ? -n : n) * 100 * 1000) / 1000;
}

/** "2026-09-01" | "9/1/2026" | "09/01/26" -> {y,m,d} */
function parseDate(s) {
  const t = String(s || '').trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(t);
  if (m) return { y: m[3].length === 2 ? 2000 + +m[3] : +m[3], m: +m[1], d: +m[2] };
  return null;
}

/** "00:00" | "0:00:00" | "12:15 AM" | "24:00" -> minutes after midnight */
function parseTime(s) {
  const t = String(s || '').trim();
  const m = /(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]\.?m\.?)?/i.exec(t);
  if (!m) return null;
  let h = +m[1];
  const mi = +m[2];
  if (m[3]) {
    const pm = /^p/i.test(m[3]);
    if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12;
  }
  if (h > 24 || mi > 59) return null;
  return h * 60 + mi;
}

const explicitOffset = (s) => /T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/.test(String(s || '').trim());

/** Minutes the zone is ahead of UTC at this instant (America/Chicago in July: -300). */
const FORMATS = new Map();
function formatter(kind, timeZone) {
  const k = `${kind}|${timeZone}`;
  let f = FORMATS.get(k);
  if (!f) {
    f = kind === 'offset'
      ? new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : new Intl.DateTimeFormat('en-CA', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' });
    FORMATS.set(k, f);
  }
  return f;
}

export function zoneOffsetMinutes(utcMs, timeZone) {
  const dtf = formatter('offset', timeZone);
  const p = {};
  for (const x of dtf.formatToParts(new Date(utcMs))) p[x.type] = x.value;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUtc - utcMs) / 60000);
}

/** A wall-clock time at the house -> the UTC instant. */
export function wallToUtcMs({ y, m, d }, minutes, timeZone) {
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  const off = zoneOffsetMinutes(guess, timeZone);
  let utc = guess - off * 60000;
  const off2 = zoneOffsetMinutes(utc, timeZone);
  if (off2 !== off) utc = guess - off2 * 60000;
  return utc;
}

/**
 * Parse a utility usage CSV. `timeZone` is the house's zone: the portal writes
 * wall-clock times at the meter, and they become instants here, with the
 * repeated hour of the autumn clock change kept as two different hours.
 */
export function parseUsageCsv(text, { timeZone = 'America/Chicago' } = {}) {
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  let hi = -1;
  let cols = null;
  for (let i = 0; i < Math.min(lines.length, 60); i += 1) {
    const cells = splitCsvLine(lines[i]).map((c) => c.toLowerCase());
    const find = (re) => cells.findIndex((c) => re.test(c));
    const c = { date: find(H.date), start: find(H.start), end: find(H.end), usage: find(H.usage), cost: find(H.cost), units: find(H.units), type: cells.indexOf('type') };
    if (c.usage >= 0 && (c.date >= 0 || c.start >= 0)) { hi = i; cols = c; break; }
  }
  if (hi < 0) return { ok: false, reason: 'not-a-meter-file' };

  const header = splitCsvLine(lines[hi]);
  const headUnit = unitWord(header[cols.usage]);
  if (headUnit && headUnit.refuse) return { ok: false, reason: headUnit.refuse };
  if (!headUnit && cols.units < 0) return { ok: false, reason: 'no-unit' };

  const readings = [];
  const notes = [];
  let bad = 0;
  const seenWall = new Set();
  let refusedRows = null;
  for (let i = hi + 1; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    const cell = splitCsvLine(raw);
    const unit = headUnit || unitWord(cell[cols.units]);
    if (!unit) { bad += 1; continue; }
    if (unit.refuse) { refusedRows = unit.refuse; continue; }
    const v = Number(String(cell[cols.usage] || '').replace(/,/g, ''));
    if (!Number.isFinite(v)) { bad += 1; continue; }

    const startCell = cols.start >= 0 ? cell[cols.start] : '';
    let startMs;
    let seconds = null;
    if (explicitOffset(startCell)) {
      startMs = Date.parse(startCell);
      const endCell = cols.end >= 0 ? cell[cols.end] : '';
      if (explicitOffset(endCell)) seconds = (Date.parse(endCell) - startMs) / 1000;
    } else {
      const date = parseDate(cols.date >= 0 ? cell[cols.date] : startCell);
      if (!date) { bad += 1; continue; }
      const sMin = startCell ? parseTime(startCell.replace(/^\S+\s+(?=\d{1,2}:)/, '')) : null;
      const eCell = cols.end >= 0 ? cell[cols.end] : '';
      const eMin = eCell ? parseTime(eCell.replace(/^\S+\s+(?=\d{1,2}:)/, '')) : null;
      if (sMin == null) {
        // A daily row lasts from this midnight to the next one at the house:
        // 23 or 25 hours on the two clock-change days, never a fixed 24.
        startMs = wallToUtcMs(date, 0, timeZone);
        const next = new Date(Date.UTC(date.y, date.m - 1, date.d + 1));
        seconds = (wallToUtcMs({ y: next.getUTCFullYear(), m: next.getUTCMonth() + 1, d: next.getUTCDate() }, 0, timeZone) - startMs) / 1000;
      } else {
        startMs = wallToUtcMs(date, sMin, timeZone);
        if (eMin != null) {
          let diff = eMin - sMin;
          if (diff <= 0) diff += 1440;
          if ((diff + 1) % 15 === 0) diff += 1; // an inclusive end: 00:00-00:59 is an hour
          seconds = diff * 60;
        }
      }
      // The autumn clock change writes the 1 o'clock hour twice. The second time
      // a wall time appears where the clock folds, it is the LATER hour, never a
      // duplicate to throw away. Keyed on the wall time, so a file written
      // newest-first is not shifted.
      const wall = `${date.y}-${date.m}-${date.d} ${sMin}`;
      if (seenWall.has(wall) && zoneOffsetMinutes(startMs + 3600000, timeZone) !== zoneOffsetMinutes(startMs, timeZone)) startMs += 3600000;
      seenWall.add(wall);
    }
    if (!Number.isFinite(startMs)) { bad += 1; continue; }
    readings.push({
      startMs,
      seconds,
      amount: Math.abs(v) * unit.factor,
      unit: unit.unit,
      commodity: unit.commodity,
      direction: v < 0 ? 'received' : 'delivered',
      costCents: cols.cost >= 0 ? money(cell[cols.cost]) : null,
      quality: /estimat/i.test(raw) ? 'estimated' : 'measured',
    });
  }
  if (!readings.length) return { ok: false, reason: refusedRows || 'no-readings' };

  // A file with start times but no end column: the interval is the spacing the
  // file itself keeps, measured, never assumed to be an hour.
  if (readings.some((r) => r.seconds == null)) {
    const gaps = new Map();
    for (let i = 1; i < readings.length; i += 1) {
      const g = (readings[i].startMs - readings[i - 1].startMs) / 1000;
      if (g > 0) gaps.set(g, (gaps.get(g) || 0) + 1);
    }
    const mode = [...gaps.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!mode) return { ok: false, reason: 'no-readings' };
    for (const r of readings) if (r.seconds == null) r.seconds = mode[0];
    notes.push('The file gave start times only; each reading was taken to last as long as the file spaces them.');
  }
  if (bad) notes.push(`${bad} row(s) could not be read and were left out.`);
  if (refusedRows) notes.push('Rows measured in a unit this app does not store were left out.');
  return { ok: true, format: 'csv', readings, notes };
}

/**
 * Parse whatever the person picked. Validates, de-duplicates and sorts, so a
 * caller gets one shape whichever file came in.
 */
export function parseEnergyFile(text, { timeZone = 'America/Chicago' } = {}) {
  const s = String(text ?? '');
  if (!s.trim()) return { ok: false, reason: 'empty' };
  if (s.length > ENERGY_LIMITS.maxBytes) return { ok: false, reason: 'too-large' };
  const parsed = s.trimStart().startsWith('<') ? parseEspiXml(s) : parseUsageCsv(s, { timeZone });
  if (!parsed.ok) return parsed;

  const seen = new Map();
  let rejected = 0;
  let conflicts = 0;
  for (const r of parsed.readings) {
    if (!(r.seconds > 0) || r.seconds > ENERGY_LIMITS.maxIntervalSeconds || !Number.isFinite(r.amount) || !Number.isFinite(r.startMs)) { rejected += 1; continue; }
    const k = readingKey(r);
    const prior = seen.get(k);
    if (prior) { if (prior.amount !== r.amount) conflicts += 1; continue; }
    seen.set(k, r);
  }
  const readings = [...seen.values()].sort((a, b) => a.startMs - b.startMs || a.commodity.localeCompare(b.commodity));
  if (!readings.length) return { ok: false, reason: 'no-readings' };
  if (readings.length > ENERGY_LIMITS.maxReadings) return { ok: false, reason: 'too-many' };
  const notes = [...parsed.notes];
  if (rejected) notes.push(`${rejected} reading(s) had an impossible length or value and were left out.`);
  if (conflicts) notes.push(`${conflicts} reading(s) appeared twice with different values; the first was kept.`);
  return { ok: true, format: parsed.format, readings, notes };
}

/** The identity of a reading: re-importing an overlapping file replaces, never doubles. */
export const readingKey = (r) => `${r.commodity}|${r.direction}|${r.startMs}|${r.seconds}`;

// ---------------------------------------------------------------------------
// The reckoning. Everything below is COUNTED from the readings passed in.
// ---------------------------------------------------------------------------
function localParts(ms, timeZone) {
  const dtf = formatter('local', timeZone);
  const p = {};
  for (const x of dtf.formatToParts(new Date(ms))) p[x.type] = x.value;
  return { date: `${p.year}-${p.month}-${p.day}`, month: `${p.year}-${p.month}`, hour: +p.hour % 24 };
}

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/**
 * reckonEnergy(readings, { timeZone }) -> one block per commodity present:
 *   { commodity, unit, delivered, received, net, firstMs, lastEndMs, days,
 *     perDay, months:[{month, delivered, received, costCents}], coverage:{
 *     readings, gaps, missingHours, estimated }, cost:{ totalCents,
 *     ratePerKwhCents|ratePerThermCents, complete, reason }, electricity-only:
 *     baseloadWatts, baseloadDays, peak:{ startMs, kw }, byHour:[24] }
 * Amounts are in kWh for electricity and therms for gas.
 */
export function reckonEnergy(readings, { timeZone = 'America/Chicago' } = {}) {
  const out = [];
  for (const commodity of COMMODITIES) {
    const rs = (readings || []).filter((r) => r.commodity === commodity).sort((a, b) => a.startMs - b.startMs);
    if (!rs.length) continue;
    const toUnit = commodity === 'electricity' ? (a) => a / 1000 : (a) => a; // Wh -> kWh
    const del = rs.filter((r) => r.direction === 'delivered');
    const rec = rs.filter((r) => r.direction === 'received');
    const sum = (xs) => xs.reduce((n, r) => n + toUnit(Number(r.amount) || 0), 0);
    const delivered = sum(del);
    const received = sum(rec);

    const firstMs = rs[0].startMs;
    const lastEndMs = rs.reduce((m, r) => Math.max(m, r.startMs + r.seconds * 1000), 0);
    const dayTotals = new Map();
    const months = new Map();
    const hours = new Map(); // "date hour" -> kWh delivered in that local hour
    const hourStart = new Map(); // "date hour" -> the earliest instant in it
    for (const r of rs) {
      const lp = localParts(r.startMs, timeZone);
      const v = toUnit(Number(r.amount) || 0);
      const mo = months.get(lp.month) || { month: lp.month, delivered: 0, received: 0, costCents: 0, costed: 0, count: 0 };
      if (r.direction === 'delivered') {
        dayTotals.set(lp.date, (dayTotals.get(lp.date) || 0) + v);
        mo.delivered += v;
        mo.count += 1;
        if (r.costCents != null) { mo.costCents += Number(r.costCents); mo.costed += 1; }
        if (r.seconds <= 3600) {
          const hk = `${lp.date} ${lp.hour}`;
          hours.set(hk, (hours.get(hk) || 0) + v);
          if (!hourStart.has(hk) || r.startMs < hourStart.get(hk)) hourStart.set(hk, r.startMs);
        }
      } else mo.received += v;
      months.set(lp.month, mo);
    }

    // Coverage: a gap is time between one reading's end and the next start.
    let gaps = 0;
    let missingSeconds = 0;
    for (let i = 1; i < del.length; i += 1) {
      const end = del[i - 1].startMs + del[i - 1].seconds * 1000;
      if (del[i].startMs > end + 1000) { gaps += 1; missingSeconds += (del[i].startMs - end) / 1000; }
    }
    const estimated = rs.filter((r) => r.quality === 'estimated').length;

    const costed = del.filter((r) => r.costCents != null);
    const totalCents = costed.reduce((n, r) => n + Number(r.costCents), 0);
    const complete = del.length > 0 && costed.length === del.length;
    const rateKey = commodity === 'electricity' ? 'ratePerKwhCents' : 'ratePerThermCents';
    const cost = {
      totalCents: costed.length ? totalCents : null,
      [rateKey]: complete && delivered > 0 ? totalCents / delivered : null,
      complete,
      reason: !costed.length ? 'no-cost-in-file' : (complete ? null : 'partial-cost'),
    };

    const days = dayTotals.size;
    const block = {
      commodity,
      unit: commodity === 'electricity' ? 'kWh' : 'therm',
      delivered, received, net: delivered - received,
      firstMs, lastEndMs, days,
      perDay: days ? delivered / days : null,
      months: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({
        month: m.month, delivered: m.delivered, received: m.received,
        costCents: m.costed && m.costed === m.count ? m.costCents : null,
      })),
      coverage: { readings: rs.length, gaps, missingHours: missingSeconds / 3600, estimated },
      cost,
    };

    if (commodity === 'electricity') {
      // Hour-of-day profile and peak, from hourly-or-finer reads only.
      const byHourSum = Array(24).fill(0);
      const byHourN = Array(24).fill(0);
      const perDayHours = new Map();
      let peak = null;
      for (const [k, v] of hours) {
        const [date, h] = k.split(' ');
        byHourSum[+h] += v; byHourN[+h] += 1;
        const list = perDayHours.get(date) || [];
        list.push(v);
        perDayHours.set(date, list);
        if (!peak || v > peak.kwh) peak = { key: k, kwh: v };
      }
      block.byHour = byHourSum.map((s, i) => (byHourN[i] ? s / byHourN[i] : null));
      // The always-on draw: on each WHOLE day (23-25 hours read), the quietest
      // hour; the median of those across days. Seven whole days or no answer.
      const mins = [...perDayHours.values()].filter((l) => l.length >= 23).map((l) => Math.min(...l));
      block.baseloadDays = mins.length;
      block.baseloadWatts = mins.length >= 7 ? median(mins) * 1000 : null;
      block.peak = peak ? { startMs: hourStart.get(peak.key) ?? null, kwh: peak.kwh } : null;
    }
    out.push(block);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rows for the database (migration 0302). The cloud layer writes them.
// ---------------------------------------------------------------------------
export function buildReadingRows(readings, { instanceId, rentalRef, importId }) {
  return (readings || []).map((r) => ({
    instance_id: instanceId,
    rental_ref: rentalRef,
    import_id: importId,
    commodity: r.commodity,
    direction: r.direction,
    start_at: new Date(r.startMs).toISOString(),
    seconds: Math.round(r.seconds),
    amount: r.amount,
    unit: UNIT_OF[r.commodity],
    cost_cents: r.costCents == null ? null : r.costCents,
    quality: QUALITIES.includes(r.quality) ? r.quality : 'measured',
  }));
}

export function buildImportRow(parsed, { instanceId, rentalRef, fileName, sha256 }) {
  const rs = parsed.readings;
  return {
    instance_id: instanceId,
    rental_ref: rentalRef,
    file_name: String(fileName || '').slice(0, 240),
    file_sha256: sha256 || null,
    source_format: parsed.format,
    commodities: [...new Set(rs.map((r) => r.commodity))].sort(),
    reading_count: rs.length,
    first_start_at: new Date(rs[0].startMs).toISOString(),
    last_end_at: new Date(Math.max(...rs.map((r) => r.startMs + r.seconds * 1000))).toISOString(),
    notes: parsed.notes.join(' ').slice(0, 2000),
  };
}

/** A stored row back into the shape reckonEnergy reads. */
export const readingFromRow = (row) => ({
  startMs: Date.parse(row.start_at),
  seconds: Number(row.seconds),
  amount: Number(row.amount),
  unit: row.unit,
  commodity: row.commodity,
  direction: row.direction,
  costCents: row.cost_cents == null ? null : Number(row.cost_cents),
  quality: row.quality,
});

/** SHA-256 of the file text, hex, so the ledger can say "this exact file". */
export async function digestText(text, subtle = globalThis.crypto && globalThis.crypto.subtle) {
  if (!subtle) return null;
  try {
    const buf = await subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return null; }
}
