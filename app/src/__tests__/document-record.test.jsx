// @vitest-environment jsdom
// =============================================================================
// Every document carries its own record (DR-1084). Darrell, 2026-10-17, over
// "06 JUNE 2026 CALENDAR is listed, but the file itself is not on the church
// server": "presented in the system with all relevant information and details
// that matter. The data in the location and a screenshot or visual of where it
// came from and a timestamps for obvious reasons".
//
// PROVEN-TO-CATCH (DR-0076 §3): the failure that matters is a record that
// reads complete and traces to nothing. So every case feeds a row and requires
// that what is shown came FROM that row — and that what the row lacks is left
// out or said "not recorded", never filled.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob as NodeBlob } from 'node:buffer';

import {
  REPOINT_DAY, TEAM_IMPORT_SENDER, filedBeforeRepoint, fingerprintOf, householdDocRecord, legalDocRecord,
  memberDocRecord, presenceLine, recordText, sermonDocRecord, sizeLabel, stamp, teamDocRecord,
} from '../lib/document-record.js';
import DocumentViewer from '../components/DocumentViewer.jsx';
import { toTeamDocShape } from '../lib/choir-sync.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => readFileSync(join(SRC, p), 'utf8');

// The row behind Darrell's screenshot, as choir_team_documents holds it.
const CALENDAR_ROW = {
  id: 't-cal', doc_date: '2026-06-01', doc_type: 'calendar', title: '06 JUNE 2026 CALENDAR',
  document_url: 'inst/msg-abc/06 JUNE 2026 CALENDAR.pdf', document_source: 'email',
  email_id: '<CAKx123@mail.gmail.com>', created_at: '2026-06-14T21:01:00Z', updated_at: null,
};
const sec = (rec, id) => rec.sections.find((s) => s.id === id);
const val = (rec, id, label) => (sec(rec, id)?.rows.find(([k]) => k === label) || [])[1];

describe('the team document record is the row, nothing more', () => {
  const rec = teamDocRecord(toTeamDocShape(CALENDAR_ROW), { admin: true });

  it('the shape now carries the email id and the change time the table always had', () => {
    expect(toTeamDocShape(CALENDAR_ROW)).toMatchObject({ emailId: '<CAKx123@mail.gmail.com>', updatedAt: null });
  });
  it('names what it is, where it came from, when, and where it lives', () => {
    expect(val(rec, 'what', 'Title')).toBe('06 JUNE 2026 CALENDAR');
    expect(val(rec, 'what', 'Type')).toBe('Calendar');
    expect(val(rec, 'what', 'File')).toBe('06 JUNE 2026 CALENDAR.pdf');
    expect(val(rec, 'from', 'Source')).toBe('An email');
    expect(val(rec, 'from', 'Message-ID')).toBe('<CAKx123@mail.gmail.com>');
    expect(val(rec, 'when', 'Dated')).toBe('2026-06-01');
    expect(val(rec, 'when', 'Filed here')).toBe('2026-06-14 21:01 UTC');
    expect(val(rec, 'where', 'Stored at')).toBe('inst/msg-abc/06 JUNE 2026 CALENDAR.pdf');
  });
  it('the email card shows the envelope the import read, and says where the sender comes from', () => {
    const card = sec(rec, 'from').card;
    expect(card).toMatchObject({ kind: 'email', from: TEAM_IMPORT_SENDER, subject: '06 JUNE 2026 CALENDAR' });
    // The sender is the import's own constant, not a guess: pinned to the script.
    expect(readFileSync(join(SRC, '..', '..', 'scripts/sermon-import/import-team.mjs'), 'utf8'))
      .toContain(`const SENDER = '${TEAM_IMPORT_SENDER}'`);
  });
  it('a row filed before the move knows its original is on the old server', () => {
    expect(rec.beforeRepoint).toBe(true);
    expect(filedBeforeRepoint('2026-08-19T10:00:00Z')).toBe(false);
    expect(filedBeforeRepoint(null)).toBe(false);
  });
  it('REFUSES to invent: an uploaded row has no email card, no Message-ID, and no change time it was not given', () => {
    const up = teamDocRecord({ title: 'Flyer', docType: 'other', documentSource: 'upload', documentUrl: 'data:image/png;base64,AA', createdAt: null });
    expect(sec(up, 'from').card).toBeNull();
    expect(val(up, 'from', 'Message-ID')).toBeUndefined();
    expect(val(up, 'when', 'Last changed')).toBeUndefined();
    expect(val(up, 'when', 'Filed here')).toBe('not recorded');
    expect(val(up, 'what', 'File')).toBeUndefined();     // a data url is not a file name
    expect(val(up, 'where', 'Stored at')).toBeUndefined(); // nor a path
  });
});

describe('who sees what: office detail is narrower, and narrow is the default', () => {
  it('a roster member sees what, where from and when, but not the stored path or the Message-ID', () => {
    const member = teamDocRecord(toTeamDocShape(CALENDAR_ROW));
    expect(member.admin).toBe(false);
    expect(val(member, 'where', 'Stored at')).toBeUndefined();
    expect(val(member, 'from', 'Message-ID')).toBeUndefined();
    expect(sec(member, 'from').card.messageId).toBe('');
    // What every reader may know stays.
    expect(val(member, 'what', 'Title')).toBe('06 JUNE 2026 CALENDAR');
    expect(val(member, 'when', 'Dated')).toBe('2026-06-01');
    expect(sec(member, 'from').card.from).toBe(TEAM_IMPORT_SENDER);
  });
  it('the office sees both, and the saved record of a member carries no office detail', () => {
    const office = teamDocRecord(toTeamDocShape(CALENDAR_ROW), { admin: true });
    expect(val(office, 'where', 'Stored at')).toBe('inst/msg-abc/06 JUNE 2026 CALENDAR.pdf');
    const memberText = recordText(teamDocRecord(toTeamDocShape(CALENDAR_ROW)), { title: 'x' });
    expect(memberText).not.toContain('Message-ID');
    expect(memberText).not.toContain('inst/msg-abc');
  });
  it('a household reader of someone else’s legal paper does not see where it is stored', () => {
    const shared = legalDocRecord({ label: 'Filed', storagePath: 'u/x.pdf', fromHousehold: true, sharedBy: 'Christina' });
    expect(val(shared, 'where', 'Stored at')).toBeUndefined();
    expect(val(legalDocRecord({ label: 'Mine', storagePath: 'u/x.pdf' }, { admin: true }), 'where', 'Stored at')).toBe('u/x.pdf');
  });
});

describe('the other four shelves', () => {
  it('legal: a pointer says where the paper is and claims no server copy', () => {
    const r = legalDocRecord({ label: 'Operating agreement', docType: 'Operating agreement', privileged: true, whereFiled: 'fire safe', createdAt: '2026-10-16T12:00:00Z' });
    expect(val(r, 'where', 'Server')).toBe('No file in the app');
    expect(val(r, 'where', 'Paper kept at')).toBe('fire safe');
    expect(val(r, 'what', 'Privileged')).toBe('Yes');
  });
  it('legal: a household paper names who shared it', () => {
    const r = legalDocRecord({ label: 'Filed', storagePath: 'u/x.pdf', fileSize: 2048, fromHousehold: true, sharedBy: 'Christina' });
    expect(val(r, 'from', 'Shared by')).toBe('Christina');
    expect(val(r, 'what', 'Size')).toBe('2 KB');
  });
  it('member, household and sermon records come from their rows', () => {
    expect(val(memberDocRecord({ title: 'Baptism', kindLabel: 'Certificate', storagePath: 'i/u/b.pdf', sharedWithOffice: true }), 'from', 'Shared with the office')).toBe('Yes');
    expect(val(householdDocRecord({ label: 'Passport', categoryLabel: 'Identity', expiresOn: '2030-01-01' }), 'when', 'Expires')).toBe('2030-01-01');
    expect(val(sermonDocRecord({ title: 'Let Go', documentUrl: 'https://docs.example/x', documentSource: 'email' }), 'where', 'Server')).toBe('Another website');
  });
});

describe('small honest helpers', () => {
  it('absent is never zero', () => {
    expect(stamp(null)).toBe('');
    expect(stamp('nonsense')).toBe('');
    expect(sizeLabel(null)).toBe('');
    expect(sizeLabel(0)).toBe('');
  });
  it('the presence line reads the server’s answer, and names the move for an old row', () => {
    const old = { beforeRepoint: true };
    expect(presenceLine({ phase: 'failed', reason: 'not-on-server' }, old)).toMatch(new RegExp(`before the move on ${REPOINT_DAY}`));
    expect(presenceLine({ phase: 'failed', reason: 'not-on-server' }, { beforeRepoint: false })).not.toMatch(/before the move/);
    expect(presenceLine({ phase: 'shown' }, old)).toMatch(/On the church server/);
  });
  it('the fingerprint is the SHA-256 of the bytes', async () => {
    // Node's Blob: jsdom's Blob is a different realm that Node's SubtleCrypto
    // will not read. In a browser both are one class.
    const fp = await fingerprintOf(new NodeBlob(['abc']));
    expect(fp).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await fingerprintOf(null)).toBe('');
  });
  it('the saved record carries every section, the email envelope, the state and the fingerprint', () => {
    const t = recordText(teamDocRecord(toTeamDocShape(CALENDAR_ROW), { admin: true }), { title: '06 JUNE 2026 CALENDAR', presence: 'Listed, but…', fingerprint: 'ff00', at: '2026-10-17T05:55:00Z' });
    for (const s of ['WHAT IT IS', 'WHERE IT CAME FROM', 'WHEN', 'WHERE IT LIVES', `From: ${TEAM_IMPORT_SENDER}`, 'Message-ID: <CAKx123@mail.gmail.com>', 'FILE NOW', 'ff00', 'Recorded 2026-10-17 05:55 UTC']) {
      expect(t, s).toContain(s);
    }
  });
});

// --- on screen ---------------------------------------------------------------
let container; let root;
const realFetch = globalThis.fetch;
afterEach(() => {
  try { act(() => root.unmount()); } catch { /* noop */ }
  container?.remove();
  globalThis.fetch = realFetch;
});
if (typeof URL.createObjectURL !== 'function') URL.createObjectURL = () => 'blob:test';
if (typeof URL.revokeObjectURL !== 'function') URL.revokeObjectURL = () => {};
async function show(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(DocumentViewer, { title: '06 JUNE 2026 CALENDAR', onClose: () => {}, ...props })); });
  for (let i = 0; i < 8; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}
const q = (id) => document.body.querySelector(`[data-testid="${id}"]`);

describe('the viewer shows the record beside the document', () => {
  it('the screenshot’s case: missing file, its record, why it is missing, and one sentence not two', async () => {
    await show({ resolve: async () => ({ ok: false, reason: 'not-on-server' }), record: teamDocRecord(toTeamDocShape(CALENDAR_ROW), { admin: true }) });
    expect(q('document-record')).not.toBeNull();
    expect(q('record-presence').textContent).toMatch(/not on the church server yet/);
    expect(q('record-presence').textContent).toMatch(/old hosted server/);
    expect(q('viewer-failed')).toBeNull(); // the record says it once
    expect(q('record-email-card').textContent).toContain(TEAM_IMPORT_SENDER);
    expect(q('record-when').textContent).toContain('2026-06-14 21:01 UTC');
    expect(q('record-save')).not.toBeNull();
    expect(q('record-fingerprint')).toBeNull(); // no bytes, no fingerprint claimed
  });
  it('a present file is opened, fingerprinted from its bytes, and its record saved', async () => {
    globalThis.fetch = async () => new Response('Rehearsal at 6.', { headers: { 'content-type': 'text/plain' } });
    await show({ resolve: async () => 'https://s/storage/v1/object/sign/b/a.txt', record: legalDocRecord({ label: 'Note', storagePath: 'u/a.txt' }) });
    expect(q('viewer-text').textContent).toBe('Rehearsal at 6.');
    expect(q('record-presence').textContent).toMatch(/On the church server/);
    expect(q('record-fingerprint').textContent).toMatch(/[0-9a-f]{64}/);
  });
  it('without a record the viewer is exactly as it was (DR-1078)', async () => {
    await show({ resolve: async () => ({ ok: false, reason: 'not-on-server' }) });
    expect(q('document-record')).toBeNull();
    expect(q('viewer-failed').textContent).toMatch(/not on the church server/);
  });
});

describe('every shelf hands its record to the viewer', () => {
  it.each([
    ['components/Choir.jsx', 'record: teamDocRecord(d, { admin: !!canEdit })'],
    ['components/Legal.jsx', 'record: legalDocRecord(doc, { admin: !doc.fromHousehold })'],
    ['components/Pulpit.jsx', 'record: sermonDocRecord('],
    ['components/ChurchMemberSpace.jsx', 'record: memberDocRecord('],
    ['components/HouseholdSpace.jsx', 'record: householdDocRecord('],
  ])('%s', (file, needle) => { expect(src(file)).toContain(needle); });
});
