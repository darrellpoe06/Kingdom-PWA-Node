// =============================================================================
// The office's pictures read onto their days (DR-1628): the request, the
// checks every event passes before it may be filed, and the runner's reader
// against a fake Messages API (budget, stop-after-failures, read-once).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readRequest,
  readPrompt,
  answerJson,
  checkRead,
  isStandingService,
  dateAllowed,
  picturesToRead,
  READ_MODEL,
  READ_SCHEMA,
} from '../lib/church-calendar-read.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { readFolder } from '../../../scripts/church-calendar-read.mjs';

const services = COLG_DEFAULT_CHURCH.services;
const NOV = { kind: 'calendar', year: 2026, month: 11, services };

describe('the request', () => {
  it('sends the picture and a schema-bound answer on the current model', () => {
    const body = readRequest({ ...NOV, base64: 'AAAA', mediaType: 'image/jpeg' });
    expect(body.model).toBe(READ_MODEL);
    expect(body.output_config.format).toEqual({ type: 'json_schema', schema: READ_SCHEMA });
    expect(body.messages[0].content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } });
    expect(body).not.toHaveProperty('thinking');
    expect(body).not.toHaveProperty('temperature');
  });
  it('names the month and the weekly services to leave out', () => {
    const p = readPrompt(NOV);
    expect(p).toContain('November 2026');
    expect(p).toContain('Sunday 11:00 AM Sunday Worship');
    expect(p).toMatch(/Never invent/);
    expect(readPrompt({ ...NOV, kind: 'flyer' })).toMatch(/no printed date announces nothing/);
  });
});

describe('the answer', () => {
  it('is JSON text, or nothing on a refusal or a cut-off', () => {
    expect(answerJson({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{"events":[]}' }] })).toEqual({ events: [] });
    expect(answerJson({ stop_reason: 'refusal', content: [{ type: 'text', text: '{"events":[]}' }] })).toBeNull();
    expect(answerJson({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"ev' }] })).toBeNull();
    expect(answerJson({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Sure! Here are' }] })).toBeNull();
  });
});

describe('every event is checked before it may be filed', () => {
  // The November 2026 calendar as the office printed it (a few of its squares).
  const answer = {
    events: [
      { date: '2026-11-24', name: 'NA Meeting', time: '9:00 AM', place: 'Café', detail: '' },
      { date: '2026-11-15', name: 'Battle Cry Sunday', time: '', place: '', detail: '' },
      { date: '2026-11-29', name: 'Communion', time: '', place: '', detail: '' },
      { date: '2026-11-22', name: 'Worship', time: '11:00 AM', place: '', detail: '' },
      { date: '2026-11-25', name: 'Rap Bible Study', time: '1:00 PM & 6:00 PM', place: '', detail: '' },
      { date: '2026-12-01', name: 'Next month', time: '', place: '', detail: '' },
      { date: '2026-11-31', name: 'No such day', time: '', place: '', detail: '' },
      { date: '2026-11-24', name: 'na  meeting', time: '', place: '', detail: '' },
      { date: '2026-11-10', name: '', time: '', place: '', detail: '' },
    ],
  };
  const r = checkRead(answer, NOV);
  it('keeps the real events on their days', () => {
    expect(r.events.map((e) => `${e.date} ${e.name}`)).toEqual(['2026-11-15 Battle Cry Sunday', '2026-11-24 NA Meeting', '2026-11-29 Communion']);
    expect(r.events[1]).toMatchObject({ time: '9:00 AM', place: 'Café' });
  });
  it('drops and counts what fails, by reason', () => {
    expect(r.reasons).toEqual({ 'weekly-service': 2, 'day-outside': 2, twice: 1, 'no-name': 1 });
    expect(r.dropped).toBe(6);
  });
  it('PROVEN TO CATCH: "Sunday Worship" at 11 on a Sunday is the standing service, at 7 PM it is not', () => {
    expect(isStandingService({ date: '2026-11-22', name: 'Worship', time: '11:00 AM' }, services)).toBe(true);
    expect(isStandingService({ date: '2026-11-22', name: 'Worship', time: '7:00 PM' }, services)).toBe(false);
    expect(isStandingService({ date: '2026-11-23', name: 'Worship', time: '11:00 AM' }, services)).toBe(false);
    expect(isStandingService({ date: '2026-11-25', name: 'Rap Bible Study', time: '1:00 PM & 6:00 PM' }, services)).toBe(true);
  });
  it('a flyer may speak a year either side of its month; a calendar only of its own', () => {
    expect(dateAllowed('2027-11-14', { kind: 'flyer', year: 2026, month: 11 })).toBe(true);
    expect(dateAllowed('2028-01-01', { kind: 'flyer', year: 2026, month: 11 })).toBe(false);
    expect(dateAllowed('2026-10-31', { kind: 'calendar', year: 2026, month: 11 })).toBe(false);
  });
  it('a broken answer files nothing, and never throws', () => {
    expect(checkRead(null, NOV)).toEqual({ events: [], dropped: 0, reasons: {} });
    expect(checkRead({ events: 'x' }, NOV).events).toEqual([]);
  });
});

describe('which pictures are read', () => {
  const it_ = (kind, sha, y, m) => ({ kind, sha256: sha.repeat(64), for_year: y, for_month: m });
  it('calendars and flyers, newest month first, calendar before flyer, not one already read, at most the budget', () => {
    const items = [
      it_('flyer', 'a', 2026, 11),
      it_('letter', 'b', 2026, 11),
      it_('calendar', 'c', 2026, 11),
      it_('calendar', 'd', 2025, 11),
      it_('flyer', 'e', 2026, 12),
    ];
    expect(picturesToRead(items, { max: 3 }).map((i) => i.sha256[0])).toEqual(['e', 'c', 'a']);
    expect(picturesToRead(items, { max: 10, done: new Set(['e'.repeat(64)]) }).map((i) => i.sha256[0])).toEqual(['c', 'a', 'd']);
  });
});

describe('the runner reader', () => {
  const folder = () => {
    const dir = mkdtempSync(join(tmpdir(), 'cal-read-'));
    mkdirSync(join(dir, 'files'));
    const items = [];
    for (const [kind, sha] of [
      ['calendar', 'c'],
      ['flyer', 'f'],
    ]) {
      const file = `${sha.repeat(64)}.jpeg`;
      writeFileSync(join(dir, 'files', file), Buffer.from([0xff, 0xd8, 0xff, 1]));
      items.push({ kind, sha256: sha.repeat(64), title: kind, for_year: 2026, for_month: 11, content_type: 'image/jpeg', file });
    }
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ slug: 'colg', items }));
    return dir;
  };
  const ok = (events) => ({ ok: true, json: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ events }) }] }) });

  it('reads each picture once and keeps an empty read (so it is never paid for twice)', async () => {
    let calls = 0;
    const fetchImpl = async (url, init) => {
      calls += 1;
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(init.headers['x-api-key']).toBe('k');
      return calls === 1 ? ok([{ date: '2026-11-24', name: 'NA Meeting', time: '9:00 AM', place: 'Café', detail: '' }]) : ok([]);
    };
    const r = await readFolder(folder(), { fetchImpl, apiKey: 'k', services });
    expect(calls).toBe(2);
    expect(r.failed).toEqual([]);
    expect(r.reads.map((x) => [x.kind, x.events.length])).toEqual([
      ['calendar', 1],
      ['flyer', 0],
    ]);
  });

  it('PROVEN TO CATCH: a failed read is not written (tried again next run), and two failures with nothing read stop the spending', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return { ok: false, status: 401, json: async () => ({}) };
    };
    const dir = folder();
    const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    manifest.items.push({ ...manifest.items[1], sha256: 'g'.repeat(64) });
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest));
    const r = await readFolder(dir, { fetchImpl, apiKey: 'bad', services });
    expect(r.reads).toEqual([]);
    expect(r.failed.map((f) => f.why)).toEqual(['HTTP 401', 'HTTP 401']);
    expect(calls).toBe(2);
  });

  it('a refusal is a failure, not an empty calendar', async () => {
    const fetchImpl = async () => ({ ok: true, json: async () => ({ stop_reason: 'refusal', content: [] }) });
    const r = await readFolder(folder(), { fetchImpl, apiKey: 'k', services });
    expect(r.reads).toEqual([]);
    expect(r.failed[0].why).toBe('refused');
  });
});
