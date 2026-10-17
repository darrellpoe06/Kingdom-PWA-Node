// @vitest-environment jsdom
// =============================================================================
// The shelf report is the shelf's own records, line for line (DR-1087).
// Darrell, 2026-10-17: "How can we make it easy for getting accurate data
// driven reports".
//
// PROVEN-TO-CATCH (DR-0076 §3): a report is only accurate if every cell is a
// value the record panel already shows. So each case builds records the way the
// shelves do, then requires every report cell to equal that record's own value,
// requires office-only detail to stay out for a non-office reader, and requires
// the print heading to count documents, not transactions.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { REPOINT_DAY, legalDocRecord, recordValue, shelfReport, teamDocRecord } from '../lib/document-record.js';
import { reportToCSV, reportToPrintHTML } from '../lib/report-export.js';
import ShelfLedger, { sortLedger } from '../components/ShelfLedger.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => readFileSync(join(SRC, p), 'utf8');

const CALENDAR = {
  title: '06 JUNE 2026 CALENDAR', docType: 'calendar', docDate: '2026-06-01',
  documentSource: 'email', emailId: '<abc@mail>', documentUrl: 'church/msg-1/calendar.pdf',
  createdAt: '2026-06-02T14:05:00Z', updatedAt: '2026-06-03T09:00:00Z',
};
const ORDER = {
  title: 'Order of Service', docType: 'order-of-service', docDate: '2026-09-28',
  documentSource: 'manual', documentUrl: 'church/manual/order.pdf', createdAt: '2026-09-27T20:00:00Z',
};

describe('every cell is the record\'s own value', () => {
  const records = [teamDocRecord(CALENDAR), teamDocRecord(ORDER)];
  const model = shelfReport(records, { title: 'Team documents', at: '2026-10-17T12:00:00Z' });

  it('one line per document, in the shelf\'s order', () => {
    expect(model.groups).toHaveLength(1);
    expect(model.groups[0].rows.map((r) => r.title)).toEqual(['06 JUNE 2026 CALENDAR', 'Order of Service']);
  });

  it('dates, source and place match what the record panel shows', () => {
    records.forEach((rec, i) => {
      const row = model.groups[0].rows[i];
      expect(row.dated).toBe(recordValue(rec, ['Dated']));
      expect(row.filed).toBe(recordValue(rec, ['Filed here']));
      expect(row.changed).toBe(recordValue(rec, ['Last changed']));
      expect(row.source).toBe(recordValue(rec, ['Source']));
      expect(row.server).toBe(recordValue(rec, ['Server']));
    });
    expect(model.groups[0].rows[0]).toMatchObject({ dated: '2026-06-01', filed: '2026-06-02 14:05 UTC', source: 'An email' });
  });

  it('a fact the row never kept stays blank, never guessed', () => {
    expect(model.groups[0].rows[1].changed).toBe('');
  });

  it('counts what was filed before the move, from the filing date alone', () => {
    expect(model.groups[0].rows[0].move).toBe(`Yes (before ${REPOINT_DAY})`);
    expect(model.groups[0].rows[1].move).toBe('No');
    expect(model.meta).toEqual(expect.arrayContaining([
      { label: 'Documents', value: '2' },
      { label: 'Filed before the move', value: '1' },
      { label: 'Made', value: '2026-10-17 12:00 UTC' },
    ]));
  });
});

describe('the report never shows more than the reader\'s record does', () => {
  it('office-only detail stays out for a non-office reader', () => {
    const csv = reportToCSV(shelfReport([teamDocRecord(CALENDAR)], { title: 'Team documents' }));
    expect(csv).not.toContain('<abc@mail>');
    expect(csv).not.toContain('church/msg-1/calendar.pdf');
  });

  it('a paper someone shared shows who shared it, not where it is stored', () => {
    const shared = legalDocRecord({ label: 'Reinstatement', storagePath: 'u2/reinstate.pdf', fromHousehold: true, sharedBy: 'Christina', createdAt: '2026-10-01T00:00:00Z' }, { admin: false });
    const row = shelfReport([shared]).groups[0].rows[0];
    expect(row.source).toBe('Uploaded in the app');
    expect(reportToCSV(shelfReport([shared]))).not.toContain('u2/reinstate.pdf');
  });
});

describe('the printed report counts documents', () => {
  it('says documents, not tx', () => {
    const html = reportToPrintHTML(shelfReport([teamDocRecord(CALENDAR), teamDocRecord(ORDER)], { title: 'Team documents' }));
    expect(html).toContain('2 documents');
    expect(html).not.toMatch(/\d+ tx</);
  });
  it('a money report still says tx', () => {
    const html = reportToPrintHTML({ title: 'Money', columns: [{ key: 'a', label: 'A', type: 'money' }], groups: [{ label: 'G', rows: [{ a: 1 }] }] });
    expect(html).toContain('1 tx');
  });
  it('an empty shelf makes an empty report, not an invented line', () => {
    expect(shelfReport([]).groups).toEqual([]);
  });
});

describe('the sorted view is the same report, on screen', () => {
  let host; let root;
  afterEach(() => { act(() => root && root.unmount()); host && host.remove(); });
  const docs = [ORDER, CALENDAR, { title: 'Announcements', docType: 'announcements', documentSource: 'manual', documentUrl: 'x/a.pdf' }];
  const model = shelfReport(docs.map((d) => teamDocRecord(d)), { title: 'Team documents' });
  const mount = (props) => {
    host = document.createElement('div'); document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(createElement(ShelfLedger, { model, items: docs, ...props })));
    act(() => host.querySelector('button[aria-expanded]').click());
  };
  const titles = () => [...host.querySelectorAll('tbody tr')].map((tr) => tr.querySelector('td').textContent);
  const press = (label) => act(() => [...host.querySelectorAll('button')].find((b) => b.textContent === label).click());

  it('the toggle says how many, and how many were filed before the move', () => {
    mount({});
    expect(host.querySelector('button[aria-expanded]').textContent).toContain('3 · 1 filed before the move');
  });
  it('newest first by date; a document with no date sorts last', () => {
    mount({});
    expect(titles()).toEqual(['Order of Service', '06 JUNE 2026 CALENDAR', 'Announcements']);
  });
  it('sorts by name and by type when asked', () => {
    mount({});
    press('Name');
    expect(titles()).toEqual(['06 JUNE 2026 CALENDAR', 'Announcements', 'Order of Service']);
    press('Type');
    expect(titles()[0]).toBe('Announcements');
  });
  it('shows only what was filed before the move when asked', () => {
    mount({});
    act(() => host.querySelector('input[type=checkbox]').click());
    expect(titles()).toEqual(['06 JUNE 2026 CALENDAR']);
  });
  it('a title opens that document in the shelf\'s viewer', () => {
    const onOpen = vi.fn();
    mount({ onOpen });
    act(() => [...host.querySelectorAll('tbody button')].find((b) => b.textContent === '06 JUNE 2026 CALENDAR').click());
    expect(onOpen).toHaveBeenCalledWith(CALENDAR);
  });
  it('every cell on screen is a cell of the report', () => {
    mount({});
    const cells = [...host.querySelectorAll('tbody td')].map((td) => td.textContent);
    const reportCells = model.groups[0].rows.flatMap((r) => model.columns.map((c) => r[c.key] || ''));
    expect(cells.sort()).toEqual(reportCells.sort());
  });
  it('sortLedger keeps "not recorded" with the blanks', () => {
    const rows = [{ row: { dated: 'not recorded' } }, { row: { dated: '2026-01-01' } }];
    expect(sortLedger(rows, 'dated')[0].row.dated).toBe('2026-01-01');
  });
});

describe('the six document shelves offer the report', () => {
  for (const [file, builder] of [
    ['components/Choir.jsx', 'teamDocRecord'],
    ['components/Legal.jsx', 'legalDocRecord'],
    ['components/ChurchMemberSpace.jsx', 'memberDocRecord'],
    ['components/HouseholdSpace.jsx', 'householdDocRecord'],
    ['components/BooksTaxes.jsx', 'taxDocRecord'],
    ['modules/properties/DoorTabs.jsx', 'propertyDocRecord'],
  ]) {
    it(`${file} builds it from ${builder}`, () => {
      expect(src(file)).toMatch(new RegExp(`shelfReport\\([^;]*${builder}\\(`));
      expect(src(file)).toMatch(/<ShelfLedger model=\{model\(\)\}/);
    });
  }
});
