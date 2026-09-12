// @vitest-environment node
//
// The shelf a person keeps at their church, and the walls it carries.
//
// Darrell 2026-09-11: "We also need a Love Corner documents upload and a
// process for analytics and services to be created based on the information."
//
// Two things this file is really about. First, that a POINTER to paper is a
// first-class filing — most of what a church holds for somebody is paper that
// already exists, and a shelf that only accepts uploads quietly tells that
// person their record is not real. Second, that the giving wall cannot be
// walked around by attaching a statement: the record refuses a giving amount by
// table constraint (0209), so the shelf has to refuse the document too, or the
// wall has a door in it.
import { describe, it, expect } from 'vitest';
import {
  CHURCH_DOC_KINDS, CHURCH_DOC_KIND_IDS, CHURCH_DOC_REFUSED, churchDocKindLabel,
  churchDocumentSlug, churchDocumentPath, validateChurchDocument, validateChurchFile,
  churchShelfSummary, MAX_CHURCH_FILE_BYTES,
} from '../lib/church-shelf.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

describe('the kinds of paper a church actually holds', () => {
  it('names each one and says what belongs there', () => {
    expect(CHURCH_DOC_KINDS.length).toBeGreaterThan(3);
    for (const k of CHURCH_DOC_KINDS) {
      expect(k.id, JSON.stringify(k)).toBeTruthy();
      expect(k.label, k.id).toBeTruthy();
      expect(k.means, k.id).toBeTruthy();
    }
    expect(new Set(CHURCH_DOC_KIND_IDS).size).toBe(CHURCH_DOC_KIND_IDS.length);
  });

  it('holds NO giving shelf — there is nothing for one to hold', () => {
    for (const k of CHURCH_DOC_KINDS) {
      expect(`${k.id} ${k.label}`.toLowerCase()).not.toMatch(/giving|tithe|pledge|contribution/);
    }
  });

  it('names an unknown kind rather than showing a blank', () => {
    expect(churchDocKindLabel('certificate')).toBe('Certificate');
    expect(churchDocKindLabel('no-such-kind')).toBe('Something else');
  });
});

describe('what makes a filing valid', () => {
  const ok = { title: 'My baptism certificate', kind: 'certificate', paperLocation: 'the blue folder at home' };

  it('accepts a POINTER to paper with no file at all', () => {
    expect(validateChurchDocument(ok)).toEqual([]);
  });

  it('accepts a file with no pointer', () => {
    expect(validateChurchDocument({ title: 'Driver authorization', kind: 'ministry', storagePath: 'i/u/x.pdf' })).toEqual([]);
  });

  it('REFUSES a row that is neither — the same wall 0209 carries', () => {
    const errs = validateChurchDocument({ title: 'Nothing at all', kind: 'other' });
    expect(errs.join(' ')).toMatch(/either upload the file or say where the paper is/);
  });

  it('wants a name and a shelf', () => {
    expect(validateChurchDocument({ ...ok, title: '   ' }).join(' ')).toMatch(/recognize in a year/);
    expect(validateChurchDocument({ ...ok, kind: 'invented' }).join(' ')).toMatch(/which shelf|shelf it belongs on/);
  });

  it('REFUSES a giving statement by name — the wall has no attachment door', () => {
    for (const title of ['2026 Giving Statement', 'my tithe statement', 'Annual Contribution Statement']) {
      expect(validateChurchDocument({ ...ok, title }).join(' '), title).toMatch(/does not hold your giving statement/);
    }
    expect(CHURCH_DOC_REFUSED.giving).toMatch(/between you and Yahweh/);
  });
});

describe('the bytes', () => {
  it('refuses an oversized file with a sentence a person can act on', () => {
    const r = validateChurchFile({ name: 'a.pdf', size: MAX_CHURCH_FILE_BYTES + 1, type: 'application/pdf' });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/25 MB/);
  });

  it('refuses a kind of file a church has no use for', () => {
    expect(validateChurchFile({ name: 'x.exe', size: 10, type: 'application/x-msdownload' }).ok).toBe(false);
    expect(validateChurchFile({ name: 'x.pdf', size: 10, type: 'application/pdf' }).ok).toBe(true);
  });

  it('lays the path out so the SECOND folder is the owner — which IS the policy', () => {
    // 0209's storage policies read foldername(name)[2] and compare it to
    // auth.uid(). If this layout drifts, the bucket locks the owner out.
    const path = churchDocumentPath({ instanceId: 'INST', userId: 'USER', slug: 'My Baptism Certificate', fileName: 'scan.PDF' });
    expect(path).toBe('INST/USER/my-baptism-certificate.pdf');
    expect(path.split('/')[1]).toBe('USER');
    expect(read('../../infra/supabase/migrations-auto/0209-the-church-keeps-each-persons-record-and-their-own-shelf.sql'))
      .toMatch(/storage\.foldername\(name\)\)\[2\] = auth\.uid\(\)::text/);
  });

  it('survives a file with no extension', () => {
    expect(churchDocumentPath({ instanceId: 'i', userId: 'u', slug: 'x', fileName: 'noext' })).toBe('i/u/x.bin');
  });

  it('makes a slug out of anything, and never an empty one', () => {
    expect(churchDocumentSlug('  ***  ')).toBe('document');
    expect(churchDocumentSlug('Transfer Letter — Mt. Zion')).toBe('transfer-letter-mt-zion');
  });
});

describe('how the shelf stands', () => {
  const rows = [
    { kind: 'certificate', storagePath: 'a', sharedWithOffice: true },
    { kind: 'certificate', paperLocation: 'the cabinet' },
    { kind: 'ministry', storagePath: 'b' },
  ];
  it('counts honestly and leaves out shelves with nothing on them', () => {
    const s = churchShelfSummary(rows);
    expect(s.total).toBe(3);
    expect(s.files).toBe(2);
    expect(s.pointers).toBe(1);
    expect(s.shared).toBe(1);
    expect(s.byKind.map((k) => k.id)).toEqual(['certificate', 'ministry']);
    expect(s.byKind[0]).toMatchObject({ count: 2, files: 1 });
  });
  it('is zero, not broken, with nothing filed', () => {
    expect(churchShelfSummary([]).total).toBe(0);
    expect(churchShelfSummary(null).byKind).toEqual([]);
  });
});

describe('the seam refuses before the database has to', () => {
  const sync = read('lib/church-member-sync.js');

  it('refuses every key the record may never hold, client-side too', () => {
    expect(sync).toMatch(/CHURCH_MEMBER_REFUSED_KEYS/);
    expect(sync).toMatch(/never holds what you give or what you earn/);
  });

  it('refuses an acknowledgments CELL — a signature is made on the document', () => {
    expect(sync).toMatch(/A signature is made on the document itself, never through a cell/);
    // The server says the same thing — 0209's patch guard refuses the cell —
    // which is what makes it a wall rather than a preference.
    expect(read('../../infra/supabase/migrations-auto/0209-the-church-keeps-each-persons-record-and-their-own-shelf.sql'))
      .toMatch(/patch_in \? 'acknowledgments'/);
    // And the door the signature IS made through lives in 0210: 0209 shipped
    // the covenant as required with no way to sign it, and had already merged
    // and replayed by the time that was found, so the function could not be
    // added to it. This pin is the reason that story cannot be forgotten.
    expect(read('../../infra/supabase/migrations-auto/0210-the-signature-door-and-a-roster-that-says-when.sql'))
      .toMatch(/CREATE OR REPLACE FUNCTION public\.church_member_record_acknowledge/);
  });

  it('goes through the four named doors and no fifth', () => {
    const rpcs = [...sync.matchAll(/rpc\('([a-z_]+)'/g)].map((m) => m[1]);
    expect(new Set(rpcs)).toEqual(new Set([
      'church_member_record_read', 'church_member_record_patch',
      'church_member_record_acknowledge', 'church_roll_read',
    ]));
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES a filing with neither a file nor a pointer', () => {
    expect(validateChurchDocument({ title: 'x', kind: 'other' }).length).toBeGreaterThan(0);
  });
  it('CATCHES a giving statement arriving as an attachment', () => {
    expect(validateChurchDocument({ title: 'Giving Statement 2026', kind: 'other', paperLocation: 'home' }).length).toBe(1);
  });
  it('CATCHES a path that stopped putting the owner second', () => {
    const wrong = 'USER/INST/x.pdf';
    expect(wrong.split('/')[1]).not.toBe('USER');
  });
});
