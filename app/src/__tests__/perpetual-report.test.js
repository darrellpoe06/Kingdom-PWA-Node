// perpetual-report — the portable cross-system history (Darrell 2026-07-07:
// "Perpetual reports … for everything we want to keep track of … portable and
// can sort multiple business systems"). Fixtures prove: normalization from
// every stream, honest undated handling, filter/sort behavior, CSV escaping
// (portability), and the failures & fixes coverage math.
import { describe, it, expect } from 'vitest';
import {
  buildReportRows, filterReport, sortReport, reportStatuses, reportToCsv,
  failureCoverage, REPORT_SYSTEMS,
} from '../lib/perpetual-report.js';

const FIXTURE = () => buildReportRows({
  projects: [{ id: 'p1', title: 'Roof project', startDate: '2026-06-01', status: 'active', domain: 'realestate' }],
  tasks: [{
    slug: 't1', boardSlug: 'board-x', boardTitle: 'Board X', title: 'Do the thing',
    status: 'in-progress', group: 'Phase 1', dueDate: '2026-07-10',
    links: { history: [{ at: '2026-07-03T10:00:00Z', kind: 'phase-complete', phase: 'Phase 0', boardTitle: 'Board X' }] },
  }],
  concerns: [
    { id: 'c1', concern: 'Something broke', solution: 'Fix it', status: 'open', targetDate: '2026-07-01', source: 'audit', area: 'CRM' },
    { id: 'c2', concern: 'Worked on', solution: 'Doing', status: 'in-progress', targetDate: '2026-07-02', source: 'seed' },
    { id: 'c3', concern: 'Fixed thing', solution: 'Done', status: 'done', targetDate: '2026-06-20', source: 'manual' },
  ],
  discussions: [{ id: 'd1', kind: 'decision', title: 'We chose X', body: 'because Y', status: 'open', createdAt: '2026-07-05T00:00:00Z' }],
  ledger: { ok: true, items: [{ id: 'DR-0120', title: 'Finish ripples', date: '2026-07-07', status: 'accepted', decision: 'boards ride timelines' }] },
  reviews: { ok: true, items: [{ id: 'REV-0013', title: 'Entrance review', date: '2026-07-07', type: 'ui-ux', status: 'addressed', findings: 'fixed same session', surface: 'entrance' }] },
  lessons: { ok: true, incidents: [{ date: '2026-07-06', title: 'Deploy went stale 9h' }] },
});

describe('buildReportRows', () => {
  it('normalizes every stream into the one row shape', () => {
    const rows = FIXTURE();
    const systems = new Set(rows.map((r) => r.system));
    for (const [key] of REPORT_SYSTEMS) expect(systems.has(key)).toBe(true);
    for (const r of rows) {
      expect(r.id).toBeTruthy();
      expect(typeof r.title).toBe('string');
      expect(typeof r.source).toBe('string');
    }
  });
  it('projects a board task AND its append-only history events', () => {
    const rows = FIXTURE();
    expect(rows.find((r) => r.id === 'pr-task-t1')).toMatchObject({ system: 'boards', status: 'in-progress', date: '2026-07-10' });
    const ev = rows.find((r) => r.system === 'board-events');
    expect(ev.title).toContain('Phase "Phase 0" completed');
    expect(ev.date).toBe('2026-07-03');
  });
  it('never invents a date — a dateless record stays undated', () => {
    const rows = buildReportRows({ discussions: [{ id: 'x', kind: 'directive', title: 'No date', status: 'open' }] });
    expect(rows[0].date).toBe('');
  });
  it('degrades honestly on empty/missing inputs', () => {
    expect(buildReportRows({})).toEqual([]);
    expect(buildReportRows()).toEqual([]);
  });
});

describe('filterReport / sortReport / reportStatuses', () => {
  it('filters by system, status, and text', () => {
    const rows = FIXTURE();
    expect(filterReport(rows, { system: 'lessons' })).toHaveLength(1);
    expect(filterReport(rows, { status: 'done' }).every((r) => r.status === 'done')).toBe(true);
    expect(filterReport(rows, { query: 'roof' })).toHaveLength(1);
  });
  it('sorts date-desc by default with undated rows always last', () => {
    const rows = sortReport([
      { id: 'a', date: '', title: 'undated' },
      { id: 'b', date: '2026-07-01', title: 'older' },
      { id: 'c', date: '2026-07-07', title: 'newer' },
    ]);
    expect(rows.map((r) => r.id)).toEqual(['c', 'b', 'a']);
    const asc = sortReport(rows, { key: 'date', dir: 'asc' });
    expect(asc.map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });
  it('derives the status list from the data (no hardcoded drift)', () => {
    const st = reportStatuses(FIXTURE());
    expect(st).toContain('in-progress');
    expect(st).toContain('accepted');
  });
});

describe('reportToCsv — portability', () => {
  it('escapes commas, quotes, and newlines RFC-4180 style', () => {
    const csv = reportToCsv([{ date: '2026-07-07', system: 'concerns', kind: 'audit', title: 'He said "no", twice', detail: 'line1\nline2', status: 'open', source: 's' }]);
    expect(csv.split('\r\n')[0]).toBe('date,system,kind,title,detail,status,source');
    expect(csv).toContain('"He said ""no"", twice"');
    expect(csv).toContain('"line1\nline2"');
  });
});

describe('failureCoverage — the failures & fixes lens', () => {
  it('counts open / working / closed per failure stream from the records themselves', () => {
    const cov = failureCoverage(FIXTURE());
    const concerns = cov.find((c) => c.system === 'concerns');
    expect(concerns).toMatchObject({ total: 3, open: 1, working: 1, closed: 1 });
    const reviews = cov.find((c) => c.system === 'reviews');
    expect(reviews).toMatchObject({ total: 1, closed: 1 });
    const lessons = cov.find((c) => c.system === 'lessons');
    expect(lessons).toMatchObject({ total: 1, closed: 1 });
  });
  it('CATCHES an unworked failure — a new open concern moves the open count', () => {
    const base = failureCoverage(FIXTURE()).find((c) => c.system === 'concerns');
    const withNew = failureCoverage(buildReportRows({
      concerns: [
        { id: 'c1', concern: 'a', status: 'open', source: 'audit' },
        { id: 'c4', concern: 'brand new failure', status: 'open', source: 'feedback' },
      ],
    })).find((c) => c.system === 'concerns');
    expect(withNew.open).toBe(2);
    expect(base.open).toBe(1);
  });
});
